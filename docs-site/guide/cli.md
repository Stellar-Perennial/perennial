# CLI

This page documents every command, flag, exit code, and the JSON output of the Perennial CLI.

Build first (`npm run build`), then run `node dist/cli.js`. The help text below matches the `HELP` string in `src/cli.ts`.

## Commands

| Command | What it does |
| --- | --- |
| `perennial scan` | Read-only scan of all configured entries. Sends nothing. |
| `perennial run` | Restore expired entries, then extend expiring and restored entries. |
| `perennial extend` | Only extend entries that are `expiring` or `expired`. |
| `perennial restore` | Only restore `expired` entries (and `missing` with `--include-missing`). |

Usage from the help text:

```
perennial scan     [--config FILE] [--json]
perennial run      [--config FILE] [--execute] [...]
perennial extend   [--config FILE] [--execute]
perennial restore  [--config FILE] [--execute] [--include-missing]
```

## Flags

| Flag | Applies to | What it does |
| --- | --- | --- |
| `-c, --config FILE` | all | Config file path. Default `perennial.config.json`. |
| `--execute` | `run`, `extend`, `restore` | Actually send transactions. Without it these commands are dry runs. |
| `--include-missing` | `run`, `restore` | Also try to restore entries the RPC did not return. |
| `--json` | all | Print machine-readable JSON instead of text. |
| `--no-alerts` | all | Do not send alerts. |
| `-h, --help` | — | Show help. |

The signing key is read from the environment variable named by `secretEnv` (default `PERENNIAL_SECRET`). It is never read from the config file.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success and every entry is `ok`. |
| `1` | Error: bad config, unreadable file, unknown command, network error, or `--help` with no command. |
| `2` | Scan succeeded but at least one entry is not `ok` (`expiring`, `expired`, or `missing`). Useful in CI. |

## Dry run versus execute

- `scan` never sends anything.
- `run`, `extend`, and `restore` are **dry runs by default**. A dry run prints the plan and marks actions as `dry-run`; no secret key is needed and no fee is spent.
- With `--execute`, Perennial builds and sends real transactions and needs the secret key. If the variable is unset, it fails with an error naming the variable.
- With `--execute`, if any restore in a batch fails, those entries are not extended. Entries that fail during restore or extend are reported with status `failed` and the error message.

## JSON output

With `--json`, the CLI prints one JSON object:

```json
{
  "latestLedger": 1800000,
  "entries": [
    {
      "contractId": "C...",
      "contractLabel": "my-contract",
      "kind": "instance",
      "durability": "persistent",
      "state": "ok",
      "liveUntilLedger": 2000000,
      "remainingLedgers": 200000,
      "approxRemainingDays": 11.6
    }
  ],
  "actions": [
    { "action": "extend", "count": 1, "status": "dry-run" }
  ]
}
```

Field notes:

- `kind` is `instance`, `code`, or `data`. For `data`, `durability` is set and `item` is the key's `label` or its JSON form.
- `liveUntilLedger`, `remainingLedgers`, and `approxRemainingDays` are omitted when the RPC returned no entry (`missing`).
- `actions` is empty for `scan`. Each action has `action` (`restore` or `extend`), `count`, `status` (`dry-run`, `success`, or `failed`), and for executed transactions `txHash` or `error`.
- The internal ledger key is stripped from the JSON.

## Text output

Without `--json`:

```
Latest ledger: 1800000
[ok] my-contract: instance, 200000 ledgers left (~11.6 days)
[expired] my-contract: persistent key {"type":"symbol","value":"Admin"}, 0 ledgers left (~0 days)
restore: 1 entries, success (tx abc123...)
```

For data entries the line shows `persistent key <label or JSON>`; for `instance` and `code` just the kind. Missing entries print `not returned by RPC`.

## Alerts

Unless `--no-alerts` is set, `run`, `extend`, and `restore` send an alert when any entry needs attention or any action ran. `scan` never alerts. See [Alerts](/guide/alerts).
