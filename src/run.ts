import { Keypair, rpc } from "@stellar/stellar-sdk";
import { resolveNetwork } from "./config";
import { scan } from "./scan";
import { sendExtend, sendRestore } from "./tx";
import type { ActionResult, Config, ScanResult, ScannedEntry } from "./types";

export type Mode = "auto" | "extend" | "restore";

export interface RunOptions {
  mode: Mode;
  execute: boolean; // false = dry run: nothing is sent
  includeMissing: boolean; // also try to restore entries the RPC did not return
}

export interface RunResult {
  before: ScanResult;
  after?: ScanResult;
  actions: ActionResult[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function doBatches(
  action: "restore" | "extend",
  entries: ScannedEntry[],
  server: rpc.Server,
  cfg: Config,
  kp: Keypair | undefined,
  failed: Set<string>,
): Promise<ActionResult[]> {
  const { passphrase } = resolveNetwork(cfg);
  const results: ActionResult[] = [];
  for (const batch of chunk(entries, cfg.batchSize)) {
    if (!kp) {
      results.push({ action, count: batch.length, status: "dry-run" });
      continue;
    }
    const keys = batch.map((e) => e.key);
    try {
      const txHash =
        action === "restore"
          ? await sendRestore(server, kp, passphrase, keys, cfg.maxFeeStroops)
          : await sendExtend(server, kp, passphrase, keys, cfg.extendToLedgers, cfg.maxFeeStroops);
      results.push({ action, count: batch.length, status: "success", txHash });
    } catch (err) {
      for (const e of batch) failed.add(e.key.toXDR("base64"));
      results.push({ action, count: batch.length, status: "failed", error: (err as Error).message });
    }
  }
  return results;
}

export async function runKeeper(
  server: rpc.Server,
  cfg: Config,
  opts: RunOptions,
  secret?: string,
): Promise<RunResult> {
  let kp: Keypair | undefined;
  if (opts.execute) {
    if (!secret) throw new Error(`Set the ${cfg.secretEnv} environment variable to a funded account secret key.`);
    kp = Keypair.fromSecret(secret);
  }

  const before = await scan(server, cfg);
  const actions: ActionResult[] = [];
  const failed = new Set<string>();

  if (opts.mode !== "extend") {
    const toRestore = before.entries.filter(
      (e) => e.state === "expired" || (opts.includeMissing && e.state === "missing"),
    );
    actions.push(...(await doBatches("restore", toRestore, server, cfg, kp, failed)));
  }

  if (opts.mode !== "restore") {
    const toExtend = before.entries.filter(
      (e) => (e.state === "expiring" || e.state === "expired") && !failed.has(e.key.toXDR("base64")),
    );
    actions.push(...(await doBatches("extend", toExtend, server, cfg, kp, failed)));
  }

  const after = opts.execute && actions.length > 0 ? await scan(server, cfg) : undefined;
  return { before, after, actions };
}
