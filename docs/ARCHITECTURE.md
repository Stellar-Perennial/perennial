# Architecture

```
cli.ts  ->  config.ts   load and validate the JSON config
        ->  scan.ts     read TTLs from Soroban RPC, classify each entry
        ->  run.ts      choose entries to restore/extend, batch them, call tx.ts
        ->  tx.ts       build, simulate, fee-check, sign, send, poll
        ->  alerts.ts   Slack, Telegram, webhook
keys.ts   builds ledger keys (instance, code, data)
scval.ts  turns JSON key descriptions into Soroban values
```

Flow of `run`:
1. `scan` reads the latest ledger, then the instance, the wasm code (hash found from the instance), and each configured key.
2. Expired entries are restored in batches (each restore in its own transaction).
3. Expiring and restored entries are extended in batches.
4. If anything was sent, scan again and report the final state.
5. Alerts go out if anything needed attention or an action ran.

Design choices:
- Dry run by default. `--execute` is required to spend fees.
- Secrets only from environment variables, including alert URLs and tokens.
- A fee ceiling is checked after simulation and before signing.
- Small modules so one issue touches one file.
