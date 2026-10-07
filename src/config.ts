/**
 * Loads and validates the config file, and maps network names to RPC URL and passphrase.
 * Does not read environment variables and does not talk to the network.
 */
import { readFileSync } from "node:fs";
import { Networks, StrKey } from "@stellar/stellar-sdk";
import type { Config, ContractConfig } from "./types";

export const DEFAULTS = {
  thresholdLedgers: 120_960, // about 7 days at ~5s per ledger (approximate)
  extendToLedgers: 518_400, // about 30 days (approximate)
  maxFeeStroops: 5_000_000,
  batchSize: 20,
  secretEnv: "PERENNIAL_SECRET",
} as const;

/** Public Stellar testnet RPC endpoint, used when testnet config omits rpcUrl. */
export const TESTNET_RPC = "https://soroban-testnet.stellar.org";

/** Thrown for any invalid or unreadable config; the CLI prints it without a stack trace. */
export class ConfigError extends Error {}

function positiveInt(v: unknown, name: string, fallback: number): number {
  if (v === undefined) return fallback;
  if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) {
    throw new ConfigError(`"${name}" must be a positive whole number`);
  }
  return v;
}

/**
 * Validate a raw JSON value and apply defaults for omitted fields.
 * @returns a normalized Config.
 * @throws ConfigError naming the first problem, e.g. `contracts[0].keys[1].durability`.
 */
export function parseConfig(raw: unknown): Config {
  if (typeof raw !== "object" || raw === null) throw new ConfigError("Config must be a JSON object");
  const r = raw as Record<string, unknown>;

  const network = r.network;
  if (network !== "testnet" && network !== "mainnet" && network !== "custom") {
    throw new ConfigError('"network" must be "testnet", "mainnet" or "custom"');
  }
  const rpcUrl = typeof r.rpcUrl === "string" ? r.rpcUrl : undefined;
  const networkPassphrase = typeof r.networkPassphrase === "string" ? r.networkPassphrase : undefined;
  if (network !== "testnet" && !rpcUrl) throw new ConfigError('"rpcUrl" is required unless network is "testnet"');
  if (network === "custom" && !networkPassphrase) throw new ConfigError('"networkPassphrase" is required for a custom network');

  const thresholdLedgers = positiveInt(r.thresholdLedgers, "thresholdLedgers", DEFAULTS.thresholdLedgers);
  const extendToLedgers = positiveInt(r.extendToLedgers, "extendToLedgers", DEFAULTS.extendToLedgers);
  if (extendToLedgers <= thresholdLedgers) {
    throw new ConfigError('"extendToLedgers" must be larger than "thresholdLedgers"');
  }
  const maxFeeStroops = positiveInt(r.maxFeeStroops, "maxFeeStroops", DEFAULTS.maxFeeStroops);
  const batchSize = positiveInt(r.batchSize, "batchSize", DEFAULTS.batchSize);
  const secretEnv = typeof r.secretEnv === "string" ? r.secretEnv : DEFAULTS.secretEnv;

  if (!Array.isArray(r.contracts) || r.contracts.length === 0) {
    throw new ConfigError('"contracts" must be a non-empty array');
  }
  const contracts: ContractConfig[] = r.contracts.map((c, i) => {
    const cc = c as ContractConfig;
    if (typeof cc?.id !== "string" || !StrKey.isValidContract(cc.id)) {
      throw new ConfigError(`contracts[${i}].id is not a valid contract ID (starts with "C")`);
    }
    for (const [j, k] of (cc.keys ?? []).entries()) {
      if (k.durability !== "persistent" && k.durability !== "temporary") {
        throw new ConfigError(`contracts[${i}].keys[${j}].durability must be "persistent" or "temporary"`);
      }
      if (typeof k.key !== "object" || k.key === null || typeof k.key.type !== "string") {
        throw new ConfigError(`contracts[${i}].keys[${j}].key must be an object with a "type"`);
      }
    }
    return cc;
  });

  return {
    network,
    rpcUrl,
    networkPassphrase,
    thresholdLedgers,
    extendToLedgers,
    maxFeeStroops,
    batchSize,
    secretEnv,
    contracts,
    alerts: (r.alerts as Config["alerts"]) ?? undefined,
  };
}

/**
 * Read and parse a config file from disk.
 * @throws ConfigError for an unreadable file or invalid JSON, not the raw fs/syntax error.
 */
export function loadConfig(path: string): Config {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new ConfigError(`Cannot read config file: ${path}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ConfigError(`Config file is not valid JSON: ${path}`);
  }
  return parseConfig(json);
}

/**
 * Map the configured network to an RPC URL and network passphrase.
 * The mainnet rpcUrl and the custom passphrase are guaranteed present by parseConfig.
 */
export function resolveNetwork(cfg: Config): { rpcUrl: string; passphrase: string } {
  if (cfg.network === "testnet") return { rpcUrl: cfg.rpcUrl ?? TESTNET_RPC, passphrase: Networks.TESTNET };
  if (cfg.network === "mainnet") return { rpcUrl: cfg.rpcUrl as string, passphrase: Networks.PUBLIC };
  return { rpcUrl: cfg.rpcUrl as string, passphrase: cfg.networkPassphrase as string };
}
