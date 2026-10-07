/**
 * Config and report types shared across Perennial.
 * Declarations only: no parsing, RPC calls or transaction logic lives here.
 */
import type { xdr } from "@stellar/stellar-sdk";

/**
 * One storage key, exactly as written in the config file.
 * A Rust key like `DataKey::Balance(addr)` is a "vec" of a symbol and an address.
 */
export type KeySpec =
  | { type: "symbol"; value: string }
  | { type: "string"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "u32"; value: number }
  | { type: "u64"; value: string | number } // string form avoids precision loss above 2^53
  | { type: "i128"; value: string | number }
  | { type: "address"; value: string }
  | { type: "vec"; value: KeySpec[] }
  | { type: "xdr"; value: string }; // pre-encoded base64 ScVal, for key types not listed above

/** Durability class of a Soroban contract-data entry. */
export type Durability = "persistent" | "temporary";

/**
 * One data entry to watch, from `contracts[].keys`.
 * Soroban RPC cannot list a contract's storage keys, so data keys must be listed here.
 */
export interface WatchedKey {
  label?: string; // shown in reports; falls back to the JSON of `key`
  durability: Durability;
  key: KeySpec;
}

/**
 * One contract to watch. Instance and wasm code entries are found automatically;
 * only the data keys in `keys` have to be listed (see WatchedKey).
 */
export interface ContractConfig {
  id: string;
  label?: string;
  watchInstance?: boolean; // omitted means true (scan.ts treats undefined as watch)
  watchCode?: boolean; // omitted means true
  keys?: WatchedKey[];
}

/**
 * Alert channels. The config holds only env var NAMES; the actual webhook URLs
 * and tokens are read from the environment at send time, never from the config.
 */
export interface AlertConfig {
  slack?: { webhookUrlEnv: string };
  telegram?: { botTokenEnv: string; chatIdEnv: string };
  webhook?: { urlEnv: string };
}

/**
 * Parsed config file. Contains no secrets: `secretEnv` only names the env var
 * that holds the signing key.
 */
export interface Config {
  network: "testnet" | "mainnet" | "custom";
  rpcUrl?: string; // required unless network is "testnet"
  networkPassphrase?: string; // required when network is "custom"
  thresholdLedgers: number; // act when remaining ledgers drop below this
  extendToLedgers: number; // new TTL in ledgers from now; must exceed thresholdLedgers
  maxFeeStroops: number; // transaction fee ceiling, in stroops (1 XLM = 10^7 stroops)
  batchSize: number; // watched entries per transaction
  secretEnv: string;
  contracts: ContractConfig[];
  alerts?: AlertConfig;
}

/** Which storage an entry belongs to. */
export type EntryKind = "instance" | "code" | "data";

/**
 * TTL health of one entry, from classify():
 * remaining = liveUntilLedger - latestLedger; <= 0 is expired, below the
 * threshold is expiring, and no entry returned by RPC is missing.
 */
export type EntryState = "ok" | "expiring" | "expired" | "missing";

/** One entry's scan report. Ledger counts are in ledgers; days are estimates at ~5s per ledger. */
export interface EntryReport {
  contractId: string;
  contractLabel: string; // config label, or the contract id
  kind: EntryKind;
  durability?: Durability; // unset for code entries
  item?: string; // key label or "wasm"; unset for the instance entry
  state: EntryState;
  liveUntilLedger?: number; // absolute ledger sequence number
  remainingLedgers?: number; // liveUntilLedger - latestLedger
  approxRemainingDays?: number; // estimate only: one ledger is about 5 seconds
}

/** Internal only: carries the ledger key so we can build transactions. */
export interface ScannedEntry extends EntryReport {
  key: xdr.LedgerKey;
}

/** One scan snapshot: every watched entry of every contract, all read at latestLedger. */
export interface ScanResult {
  latestLedger: number;
  entries: ScannedEntry[];
}

/** Result of one batch transaction. `count` is entries in the batch; txHash only when sent. */
export interface ActionResult {
  action: "restore" | "extend";
  count: number;
  status: "dry-run" | "success" | "failed";
  txHash?: string;
  error?: string;
}
