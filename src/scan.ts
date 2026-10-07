/**
 * Reads the TTL of watched entries from Soroban RPC and classifies them.
 * Read-only: this file never builds or sends transactions.
 */
import { rpc, xdr } from "@stellar/stellar-sdk";
import { codeKey, dataKey, instanceKey } from "./keys";
import type {
  Config,
  ContractConfig,
  Durability,
  EntryKind,
  EntryState,
  ScanResult,
  ScannedEntry,
} from "./types";

/** Rough average. Real close times vary, so day counts are estimates only. */
export const LEDGER_SECONDS = 5;

/** Convert ledgers to days at ~5s per ledger, rounded to 0.1 days. Estimate only. */
export function ledgersToDays(ledgers: number): number {
  return Math.round(((ledgers * LEDGER_SECONDS) / 86400) * 10) / 10;
}

/**
 * remaining = liveUntilLedger - latestLedger.
 * undefined means the RPC returned no entry (archived and evicted, or the key is wrong).
 */
export function classify(remaining: number | undefined, threshold: number): EntryState {
  if (remaining === undefined) return "missing";
  if (remaining <= 0) return "expired";
  if (remaining < threshold) return "expiring";
  return "ok";
}

/** Create an RPC client. allowHttp exists so plain-http URLs (e.g. local test RPCs) work. */
export function makeServer(url: string): rpc.Server {
  return new rpc.Server(url, { allowHttp: url.startsWith("http://") });
}

/** Fetch many ledger keys, chunked because getLedgerEntries caps keys per request. */
async function fetchEntries(
  server: rpc.Server,
  keys: xdr.LedgerKey[],
): Promise<Map<string, rpc.Api.LedgerEntryResult>> {
  const out = new Map<string, rpc.Api.LedgerEntryResult>();
  for (let i = 0; i < keys.length; i += 50) {
    const res = await server.getLedgerEntries(...keys.slice(i, i + 50));
    for (const e of res.entries ?? []) out.set(e.key.toXDR("base64"), e);
  }
  return out;
}

function wasmHashOf(inst: rpc.Api.LedgerEntryResult): Buffer | undefined {
  try {
    const exec = inst.val.contractData().val().instance().executable();
    if (exec.switch().name === "contractExecutableWasm") return exec.wasmHash();
  } catch {
    // Not a wasm contract, or an unexpected shape. We simply skip the code entry.
  }
  return undefined;
}

/** Build one report. remaining = liveUntilLedger - latestLedger, in ledgers. */
function makeEntry(
  c: ContractConfig,
  kind: EntryKind,
  key: xdr.LedgerKey,
  res: rpc.Api.LedgerEntryResult | undefined,
  latest: number,
  threshold: number,
  durability?: Durability,
  item?: string,
): ScannedEntry {
  const live = res?.liveUntilLedgerSeq;
  const remaining = live === undefined ? undefined : live - latest;
  return {
    contractId: c.id,
    contractLabel: c.label ?? c.id,
    kind,
    durability,
    item,
    state: classify(remaining, threshold),
    liveUntilLedger: live,
    remainingLedgers: remaining,
    approxRemainingDays: remaining === undefined ? undefined : ledgersToDays(remaining),
    key,
  };
}

/**
 * Scan one contract. The instance entry is fetched first because it holds the
 * wasm hash needed to build the code entry.
 */
async function scanContract(
  server: rpc.Server,
  c: ContractConfig,
  cfg: Config,
  latest: number,
): Promise<ScannedEntry[]> {
  const out: ScannedEntry[] = [];
  const iKey = instanceKey(c.id);
  const inst = (await fetchEntries(server, [iKey])).get(iKey.toXDR("base64"));

  if (c.watchInstance !== false) {
    out.push(makeEntry(c, "instance", iKey, inst, latest, cfg.thresholdLedgers, "persistent"));
  }

  const lookups: { kind: EntryKind; key: xdr.LedgerKey; durability?: Durability; item?: string }[] = [];
  if (c.watchCode !== false && inst) {
    const hash = wasmHashOf(inst);
    if (hash) lookups.push({ kind: "code", key: codeKey(hash), item: "wasm" });
  }
  for (const k of c.keys ?? []) {
    lookups.push({
      kind: "data",
      key: dataKey(c.id, k.key, k.durability),
      durability: k.durability,
      item: k.label ?? JSON.stringify(k.key),
    });
  }

  const found = await fetchEntries(server, lookups.map((l) => l.key));
  for (const l of lookups) {
    out.push(
      makeEntry(c, l.kind, l.key, found.get(l.key.toXDR("base64")), latest, cfg.thresholdLedgers, l.durability, l.item),
    );
  }
  return out;
}

/**
 * Scan every configured contract against one ledger.
 * @returns every watched entry, classified against cfg.thresholdLedgers.
 */
export async function scan(server: rpc.Server, cfg: Config): Promise<ScanResult> {
  const latest = (await server.getLatestLedger()).sequence;
  const entries: ScannedEntry[] = [];
  for (const c of cfg.contracts) entries.push(...(await scanContract(server, c, cfg, latest)));
  return { latestLedger: latest, entries };
}
