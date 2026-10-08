#!/usr/bin/env node
import { parseArgs } from "node:util";
import { buildMessage, describe, sendAlerts } from "./alerts";
import { ConfigError, loadConfig, resolveNetwork } from "./config";
import { runKeeper, type Mode } from "./run";
import { makeServer, scan } from "./scan";
import type { EntryReport, ScanResult } from "./types";

const HELP = `Perennial: keep Soroban contract state alive.

Usage:
  perennial scan     [--config FILE] [--json]            Read-only. Exit code 2 if anything needs attention.
  perennial run      [--config FILE] [--execute] [...]   Restore expired and extend expiring entries.
  perennial extend   [--config FILE] [--execute]         Only extend.
  perennial restore  [--config FILE] [--execute] [--include-missing]   Only restore.

Options:
  -c, --config FILE     Config file (default: perennial.config.json)
      --execute         Actually send transactions. Without it, run/extend/restore are dry runs.
      --include-missing Also try to restore entries the RPC did not return.
      --json            Print machine-readable JSON.
      --no-alerts       Do not send alerts.
  -h, --help            Show this help.

The signing key is read from the environment variable named by "secretEnv"
in your config (default PERENNIAL_SECRET). It is never read from the config file.`;

function strip(entries: ScanResult["entries"]): EntryReport[] {
  return entries.map(({ key: _key, ...rest }) => rest);
}

async function main(): Promise<number> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      config: { type: "string", short: "c", default: "perennial.config.json" },
      execute: { type: "boolean", default: false },
      "include-missing": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      "no-alerts": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const cmd = positionals[0];
  if (values.help || !cmd) {
    console.log(HELP);
    return cmd ? 0 : 1;
  }
  if (!["scan", "run", "extend", "restore"].includes(cmd)) {
    console.error(`Unknown command: ${cmd}\n\n${HELP}`);
    return 1;
  }

  const cfg = loadConfig(values.config as string);
  const { rpcUrl } = resolveNetwork(cfg);
  const server = makeServer(rpcUrl);

  let final: ScanResult;
  let actions: Awaited<ReturnType<typeof runKeeper>>["actions"] = [];

  if (cmd === "scan") {
    final = await scan(server, cfg);
  } else {
    const mode: Mode = cmd === "run" ? "auto" : (cmd as Mode);
    const res = await runKeeper(
      server,
      cfg,
      { mode, execute: values.execute as boolean, includeMissing: values["include-missing"] as boolean },
      process.env[cfg.secretEnv],
    );
    final = res.after ?? res.before;
    actions = res.actions;
    if (!values.execute && !values.json) console.log("Dry run: nothing was sent. Use --execute to send transactions.\n");
  }

  const problems = final.entries.filter((e) => e.state !== "ok");
  if (values.json) {
    console.log(JSON.stringify({ latestLedger: final.latestLedger, entries: strip(final.entries), actions }, null, 2));
  } else {
    console.log(`Latest ledger: ${final.latestLedger}`);
    for (const e of final.entries) console.log(describe(e));
    for (const a of actions) {
      console.log(`${a.action}: ${a.count} entries, ${a.status}${a.txHash ? ` (tx ${a.txHash})` : ""}${a.error ? ` - ${a.error}` : ""}`);
    }
  }

  if (!values["no-alerts"] && cmd !== "scan") {
    const msg = buildMessage(cfg.network, final, actions);
    if (msg) for (const err of await sendAlerts(cfg.alerts, msg)) console.error(`alert error: ${err}`);
  }
  return problems.length > 0 ? 2 : 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err instanceof ConfigError ? `Config error: ${err.message}` : `Error: ${(err as Error).message}`);
    process.exit(1);
  },
);
