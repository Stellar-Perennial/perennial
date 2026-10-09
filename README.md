<p align="center">
  <img src="assets/logo.png" alt="Perennial logo" width="120">
</p>

<p align="center">
  <img src="assets/banner.png" alt="Perennial: keep your Soroban state alive" width="100%">
</p>

<p align="center">
  <a href="https://github.com/stellar-Perennial/perennial/actions/workflows/ci.yml"><img src="https://github.com/stellar-Perennial/perennial/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT license">
  <img src="https://img.shields.io/badge/status-early%20alpha-orange" alt="Early alpha">
  <img src="https://img.shields.io/badge/node-%3E%3D20-blue" alt="Node 20 or newer">
</p>

# Perennial

**Keep your Soroban state alive.**

Documentation: **https://stellar-perennial.github.io/perennial/**

Soroban contract data expires unless someone pays to extend it. Expired data is archived, and your app can break until it is restored. Perennial watches the storage of the contracts you list, warns before entries run out, and extends or restores them on a schedule.

> **Status: early alpha, not yet tested against a live network.** Read [What to verify first](#what-to-verify-first) before you point it at mainnet. Perennial is an independent community project. It is not an official Stellar Development Foundation product.

## What it does

- Reads the time-to-live (TTL) of a contract's **instance**, its **wasm code**, and the **data keys you list**.
- Reports each entry as `ok`, `expiring`, `expired`, or `missing`.
- Restores expired entries and extends expiring ones (dry run by default).
- Sends alerts to Slack, Telegram, or any webhook.
- Runs from the command line or as a scheduled GitHub Action.

## Quick start

Requires Node 20 or newer.

```bash
npm install
npm run build
cp perennial.config.example.json perennial.config.json   # then edit it
node dist/cli.js scan
```

`scan` only reads. It exits with code `2` if anything needs attention, so you can use it in CI.

To act, set a funded account's secret key in your environment and run:

```bash
export PERENNIAL_SECRET=S...          # never put this in the config file
node dist/cli.js run                  # dry run: shows what it would do
node dist/cli.js run --execute        # sends transactions
```

Commands: `scan`, `run`, `extend`, `restore`. Flags: `--config FILE`, `--execute`, `--include-missing`, `--json`, `--no-alerts`.

## Config

See `perennial.config.example.json`. Main fields:

| Field | Meaning | Default |
| --- | --- | --- |
| `network` | `testnet`, `mainnet`, or `custom` | required |
| `rpcUrl` | Soroban RPC URL. Required unless `testnet`. | testnet RPC |
| `thresholdLedgers` | Act when fewer than this many ledgers remain | 120960 (about 7 days) |
| `extendToLedgers` | Extend TTL to this many ledgers from now | 518400 (about 30 days) |
| `maxFeeStroops` | Abort a transaction if its fee is above this | 5000000 |
| `batchSize` | Entries per transaction | 20 |
| `secretEnv` | Name of the env var holding the signing key | `PERENNIAL_SECRET` |
| `contracts[].keys` | Data keys to watch (see below) | none |

Day counts are estimates based on about 5 seconds per ledger.

### Watching data keys

Soroban RPC cannot list a contract's storage keys. Perennial can always find the instance and wasm code on its own, but for data entries **you must list the keys**. A key like `DataKey::Balance(address)` is a vector of a symbol and an address:

```json
{ "durability": "persistent",
  "key": { "type": "vec", "value": [
    { "type": "symbol", "value": "Balance" },
    { "type": "address", "value": "G..." } ] } }
```

Supported key types: `symbol`, `string`, `bool`, `u32`, `u64`, `i128`, `address`, `vec`, and `xdr` (a base64 ScVal for anything else). Automatic key discovery is a planned issue (see `docs/PLANNED-ISSUES.md`).

## GitHub Action

Copy `examples/perennial-schedule.yml` into your repo's `.github/workflows/`, add the `PERENNIAL_SECRET` repository secret, and keep `execute: "false"` until the dry-run output looks right.

## Safety

- Dry run unless you pass `--execute`.
- The signing key is read only from an environment variable.
- A transaction is not sent if its fee is above `maxFeeStroops`.
- Use a dedicated account with a small balance, not a treasury or admin key.

## What to verify first

This code was written without access to a live network, so these points are **unverified**:

1. `npm install` and `npm run build` succeed with the current `@stellar/stellar-sdk`. Dependency versions are open ranges. Pin them after your first successful install.
2. How the RPC reports entries that are expired but not yet evicted, and entries that are fully archived (this decides `expired` vs `missing`).
3. The maximum TTL the network allows. If `extendToLedgers` is too high the transaction will fail.
4. Restore then extend works end to end on testnet using `fixtures/contract`.
5. Whether a public mainnet RPC endpoint suits you. Set `rpcUrl` yourself.

## Project layout

```
assets/     Logo, banner, social preview
scripts/    Label and issue creation (gh CLI)
src/        TypeScript source (config, scan, tx, run, alerts, cli)
test/       Unit tests (vitest)
fixtures/   Small Soroban contract for testing
examples/   Scheduled GitHub workflow
docs/       TTL basics, architecture, planned issues
```

## Maintainers

| Name | GitHub | Contact |
| --- | --- | --- |
| <your name> | [@Dev-Marcy](https://github.com/Dev-Marcy) | Telegram: <your-telegram> |

## Community

Questions and ideas: <community link, for example a Telegram group or GitHub Discussions>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Planned work is listed in [docs/PLANNED-ISSUES.md](docs/PLANNED-ISSUES.md).

## Contributors

<a href="https://github.com/stellar-Perennial/perennial/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=stellar-Perennial/perennial" alt="Contributors">
</a>

## License

MIT
