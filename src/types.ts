import type { xdr } from "@stellar/stellar-sdk";

export type KeySpec =
  | { type: "symbol"; value: string }
  | { type: "string"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "u32"; value: number }
  | { type: "u64"; value: string | number }
  | { type: "i128"; value: string | number }
  | { type: "address"; value: string }
  | { type: "vec"; value: KeySpec[] }
  | { type: "xdr"; value: string }; // base64 ScVal, for anything else

export type Durability = "persistent" | "temporary";

export interface WatchedKey {
  label?: string;
  durability: Durability;
  key: KeySpec;
}

export interface ContractConfig {
  id: string;
  label?: string;
  watchInstance?: boolean; // default true
  watchCode?: boolean; // default true
  keys?: WatchedKey[];
}

export interface AlertConfig {
  slack?: { webhookUrlEnv: string };
  telegram?: { botTokenEnv: string; chatIdEnv: string };
  webhook?: { urlEnv: string };
}

export interface Config {
  network: "testnet" | "mainnet" | "custom";
  rpcUrl?: string;
  networkPassphrase?: string;
  thresholdLedgers: number;
  extendToLedgers: number;
  maxFeeStroops: number;
  batchSize: number;
  secretEnv: string;
  contracts: ContractConfig[];
  alerts?: AlertConfig;
}

export type EntryKind = "instance" | "code" | "data";
export type EntryState = "ok" | "expiring" | "expired" | "missing";

export interface EntryReport {
  contractId: string;
  contractLabel: string;
  kind: EntryKind;
  durability?: Durability;
  item?: string;
  state: EntryState;
  liveUntilLedger?: number;
  remainingLedgers?: number;
  approxRemainingDays?: number;
}

/** Internal only: carries the ledger key so we can build transactions. */
export interface ScannedEntry extends EntryReport {
  key: xdr.LedgerKey;
}

export interface ScanResult {
  latestLedger: number;
  entries: ScannedEntry[];
}

export interface ActionResult {
  action: "restore" | "extend";
  count: number;
  status: "dry-run" | "success" | "failed";
  txHash?: string;
  error?: string;
}
