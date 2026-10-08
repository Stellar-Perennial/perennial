# Planned issues

These 15 issues are created by `scripts/create-issues.sh` (dry run by default). Run `scripts/create-labels.sh` first. Read each issue body in that script and edit anything that no longer matches the code before you publish.

Use this as the backlog for the first Wave. Complexity follows the Drips Wave levels: Trivial (100 points), Medium (150), High (200). Re-tag honestly before publishing each issue.

Issue template (from the Drips blog): Description, Requirements and context, Suggested execution, Test and commit, Guidelines (assignment required, `Closes #id` in the PR).

## High
1. **Key discovery from ledger activity** - find a contract's data keys by reading its transactions or events through RPC, then feed them into the scan. Removes the need to list keys by hand.
2. **Testnet end-to-end test** - deploy `fixtures/contract`, let entries lapse, run restore then extend, assert the results. Runs in CI against testnet.
3. **Daemon mode** - `perennial watch` runs on an interval, keeps state, and avoids duplicate alerts.

## Medium
4. **Fee estimation report** - show the expected cost of an extend or restore before `--execute`.
5. **Mainnet safety checks** - refuse `--execute` on mainnet unless `--yes-mainnet` is set and the account balance is above a minimum.
6. **Alert de-duplication** - do not repeat the same alert within a configurable window.
7. **Max-TTL discovery** - read the network's state archival settings and cap `extendToLedgers` automatically.
8. **Wallet and key sources** - support loading the signing key from a file path or a secrets manager command, not only an env var.
9. **Prometheus metrics endpoint** - expose remaining TTL per entry for dashboards.
10. **Retry and backoff** - handle `TRY_AGAIN_LATER` and RPC timeouts with limited retries.
11. **Docker image and compose file** - run Perennial as a container with a mounted config.

## Trivial
12. **Config JSON schema** - publish `perennial.schema.json` and reference it from the example config.
13. **Colored CLI output and `--quiet`** - improve readability.
14. **`perennial init`** - write an example config file.
15. **Docs: GitHub Action walkthrough** - screenshots and a testnet example.

After the first Wave: a read-only dashboard (Medium/High), multi-account signing, and Discord alerts.
