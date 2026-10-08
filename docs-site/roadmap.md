# Roadmap

This page lists Perennial's planned work and its status.

The backlog is maintained in `docs/PLANNED-ISSUES.md` at the repo root, and the 15 issues below are created by `scripts/create-issues.sh` (dry run by default; run `scripts/create-labels.sh` first). If the issues exist on GitHub, each title links to its issue. Complexity follows the Drips Wave levels: Trivial (100 points), Medium (150), High (200). See [Contributing](/developers/contributing) for the rules.

## High (200 points)

1. [Key discovery from ledger activity](https://github.com/stellar-Perennial/perennial/issues) — find a contract's data keys by reading its transactions or events through RPC, then feed them into the scan. Removes the need to list keys by hand.
2. [Testnet end-to-end test](https://github.com/stellar-Perennial/perennial/issues) — deploy `fixtures/contract`, let entries lapse, run restore then extend, assert the results. Runs in CI against testnet.
3. [Daemon mode](https://github.com/stellar-Perennial/perennial/issues) — `perennial watch` runs on an interval, keeps state, and avoids duplicate alerts.

## Medium (150 points)

4. [Fee estimation report](https://github.com/stellar-Perennial/perennial/issues) — show the expected cost of an extend or restore before `--execute`.
5. [Mainnet safety checks](https://github.com/stellar-Perennial/perennial/issues) — refuse `--execute` on mainnet unless `--yes-mainnet` is set and the account balance is above a minimum.
6. [Alert de-duplication](https://github.com/stellar-Perennial/perennial/issues) — do not repeat the same alert within a configurable window.
7. [Max-TTL discovery](https://github.com/stellar-Perennial/perennial/issues) — read the network's state archival settings and cap `extendToLedgers` automatically.
8. [Wallet and key sources](https://github.com/stellar-Perennial/perennial/issues) — support loading the signing key from a file path or a secrets manager command, not only an env var.
9. [Prometheus metrics endpoint](https://github.com/stellar-Perennial/perennial/issues) — expose remaining TTL per entry for dashboards.
10. [Retry and backoff](https://github.com/stellar-Perennial/perennial/issues) — handle `TRY_AGAIN_LATER` and RPC timeouts with limited retries.
11. [Docker image and compose file](https://github.com/stellar-Perennial/perennial/issues) — run Perennial as a container with a mounted config.

## Trivial (100 points)

12. [Config JSON schema](https://github.com/stellar-Perennial/perennial/issues) — publish `perennial.schema.json` and reference it from the example config.
13. [Colored CLI output and `--quiet`](https://github.com/stellar-Perennial/perennial/issues) — improve readability.
14. [`perennial init`](https://github.com/stellar-Perennial/perennial/issues) — write an example config file.
15. [Docs: GitHub Action walkthrough](https://github.com/stellar-Perennial/perennial/issues) — screenshots and a testnet example.

## After the first Wave

A read-only dashboard (Medium/High), multi-account signing, and Discord alerts.

Issue links above point at the repository's issue tracker; replace the generic link with the real issue numbers once `scripts/create-issues.sh` has been run and the issues published.
