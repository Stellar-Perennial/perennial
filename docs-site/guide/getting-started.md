# Getting started

This page walks you from install to your first real (but still dry-run) keep on testnet.

Status: **early alpha, not yet tested against a live network.** Test on testnet only until you have verified everything yourself. See [Troubleshooting](/guide/troubleshooting).

## Prerequisites

- Node 20 or newer (tested with Node 22.22.1).
- A funded testnet account if you plan to send transactions. The [Stellar docs](https://developers.stellar.org/docs/testnet) describe how to get testnet XLM.
- One or more deployed Soroban contracts.

## Install and build

```bash
git clone https://github.com/stellar-Perennial/perennial.git
cd perennial
npm install
npm run build
```

This produces `dist/cli.js`.

## Create a config

```bash
cp perennial.config.example.json perennial.config.json
```

Edit `perennial.config.json`. At minimum, set `contracts[0].id` to your contract ID (it must start with `C`). The full field reference is on the [Configuration](/guide/configuration) page. Fields you leave out get defaults: threshold 120960 ledgers, extend-to 518400 ledgers, max fee 5000000 stroops, batch size 20.

## First scan

```bash
node dist/cli.js scan
```

`scan` only reads from the network. Example output shape:

```
Latest ledger: 1800000
[ok] my-contract: instance, 200000 ledgers left (~11.6 days)
[ok] my-contract: code, 200000 ledgers left (~11.6 days)
[expiring] my-contract: persistent key {"type":"symbol","value":"Admin"}, 90000 ledgers left (~5.2 days)
```

Exit codes: `0` when everything is `ok`, `2` when anything needs attention, `1` on error. See [CLI](/guide/cli).

## First dry run

```bash
node dist/cli.js run
```

Without `--execute`, `run` does not send anything and does not need a secret key. It prints what it would do:

```
Dry run: nothing was sent. Use --execute to send transactions.

Latest ledger: 1800000
[expired] my-contract: instance, 0 ledgers left (~0 days)
restore: 1 entries, dry-run
extend: 1 entries, dry-run
```

## First `--execute` on testnet

1. Put a funded testnet secret key in an environment variable. The name comes from `secretEnv` in your config (default `PERENNIAL_SECRET`):

   ```bash
   export PERENNIAL_SECRET=S...
   ```

   Never put the secret in the config file.

2. Run with `--execute`:

   ```bash
   node dist/cli.js run --execute
   ```

   This restores expired entries, then extends expiring and restored entries. Each restore is its own transaction; extends are batched (`batchSize` entries per transaction). A transaction is not sent if its fee is above `maxFeeStroops` (checked after simulation, before signing). See [Safety](/guide/safety).

3. Run `node dist/cli.js scan` again to confirm the new TTLs.

## Next steps

- Automate it with the [GitHub Action](/guide/github-action).
- Send alerts to Slack or Telegram: [Alerts](/guide/alerts).
- Understand the four entry states: [Concepts](/guide/concepts).
