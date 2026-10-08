#!/usr/bin/env bash
# Creates the planned Wave issues from docs/PLANNED-ISSUES.md using the GitHub CLI.
#
# Dry run by default. To really create issues:   DRY_RUN=0 ./scripts/create-issues.sh
# Optional: add the Wave program label after approval:   WAVE_LABEL="Stellar Wave" DRY_RUN=0 ...
# Run ./scripts/create-labels.sh first.
set -euo pipefail
REPO="${REPO:-stellar-Perennial/perennial}"
DRY_RUN="${DRY_RUN:-1}"
WAVE_LABEL="${WAVE_LABEL:-}"

create_issue() {
  local title="$1" labels="$2" body
  body="$(cat)"
  [ -n "$WAVE_LABEL" ] && labels="$labels,$WAVE_LABEL"
  if [ "$DRY_RUN" = "1" ]; then
    echo "DRY RUN: $title  [$labels]"
  else
    gh issue create --repo "$REPO" --title "$title" --label "$labels" --body "$body"
  fi
}

GUIDE='## Guidelines
- Ask to be assigned before you start. Do not open a PR for an unassigned issue.
- Put `Closes #<issue number>` in your PR description.
- Run `npm run typecheck`, `npm run build` and `npm test` before you push.
- Read `docs/TTL-BASICS.md` and `CONTRIBUTING.md` first.'

# ---------- HIGH ----------
create_issue "feat(scan): discover data keys from contract activity" "high,area:scan" <<EOF2
## Description
Soroban RPC cannot list a contract's storage keys, so today users must list every data key in the config by hand. Add key discovery so Perennial can find the keys a contract has written and watch them automatically.

## Requirements and context
- Use Soroban RPC to read the contract's past transactions or events and collect the ledger keys it touched. Check the current RPC docs for what is available and its retention window, and document the limits.
- Add a new config option, for example \`discoverKeys: true\`, off by default.
- Discovered keys are merged with the configured keys, with duplicates removed.
- Must not break existing config files.

## Suggested execution
- New file \`src/discover.ts\` exporting \`discoverKeys(server, contractId)\`.
- Call it from \`scanContract\` in \`src/scan.ts\` when enabled.
- Cache results between runs only if you also add a simple file cache option (optional).

## Test and commit
- Unit tests with mocked RPC responses.
- Manual test on testnet with \`fixtures/contract\`. Describe the steps in the PR.
- Commit example: \`feat(scan): discover data keys from contract activity\`

## Acceptance criteria
- [ ] Discovery works on testnet against the fixture contract
- [ ] Limits of the RPC retention window are documented in the README
- [ ] Existing tests still pass and new tests are added

$GUIDE
EOF2

create_issue "test(e2e): testnet restore and extend test using the fixture contract" "high,area:infra" <<EOF2
## Description
There is no end-to-end proof that restore then extend works. Add a test that deploys the fixture contract on testnet, writes entries, lets a short-lived entry fall below the threshold, then runs Perennial and checks the result.

## Requirements and context
- Use \`fixtures/contract\` (Rust). Document how to build and deploy it with the current Stellar CLI.
- The test must be skippable when no funded testnet key is present (env var).
- Use a very low \`thresholdLedgers\` so the test does not need to wait days.

## Suggested execution
- Add \`test/e2e/\` with a script and a vitest file guarded by an env var.
- Add an optional manual CI job (\`workflow_dispatch\`) that runs it.

## Test and commit
- Show the run output in the PR.
- Commit example: \`test(e2e): add testnet restore and extend test\`

## Acceptance criteria
- [ ] Test passes on testnet from a clean checkout following the written steps
- [ ] Skipped cleanly without credentials
- [ ] README or docs explain how to run it

$GUIDE
EOF2

create_issue "feat(cli): add watch mode that runs on an interval" "high,area:cli" <<EOF2
## Description
Users who do not use GitHub Actions need a long-running mode. Add \`perennial watch\` that scans on an interval and acts when needed.

## Requirements and context
- Interval set by \`--every <duration>\` (for example \`30m\`) or a config field.
- Graceful shutdown on SIGINT and SIGTERM.
- Reuses \`runKeeper\`. Dry run by default, \`--execute\` required to send transactions.
- Must not overlap two runs if one takes longer than the interval.

## Suggested execution
- New command in \`src/cli.ts\`, loop logic in a new \`src/watch.ts\`.
- Keep alert de-duplication separate (see the alert de-duplication issue).

## Test and commit
- Unit test the scheduling and no-overlap behavior with fake timers.
- Commit example: \`feat(cli): add watch mode\`

## Acceptance criteria
- [ ] \`perennial watch --every 1m\` runs repeatedly and exits cleanly on Ctrl+C
- [ ] No overlapping runs
- [ ] Docs updated

$GUIDE
EOF2

# ---------- MEDIUM ----------
create_issue "feat(tx): show expected fee before sending" "medium,area:tx" <<EOF2
## Description
Before \`--execute\`, users should see what a restore or extend will cost.

## Requirements and context
- During a dry run, simulate each batch and print the resource fee in stroops and XLM.
- Show a total across all batches.
- Use the same simulation path as the real send so the numbers match.

## Suggested execution
- Split the build and simulate step out of \`send\` in \`src/tx.ts\` so a dry run can call it.
- Print in \`src/cli.ts\` and include in \`--json\`.

## Test and commit
- Unit test fee formatting. Manual test on testnet.
- Commit example: \`feat(tx): show expected fee in dry run\`

## Acceptance criteria
- [ ] Dry run prints per-batch and total fees
- [ ] Dry run still sends nothing
- [ ] JSON output includes the fee fields

$GUIDE
EOF2

create_issue "feat(cli): add mainnet safety checks before --execute" "medium,area:cli" <<EOF2
## Description
Spending real funds by accident is the worst failure for this tool. Add guard rails for mainnet.

## Requirements and context
- On mainnet, \`--execute\` also requires \`--yes-mainnet\`.
- Refuse to run if the signing account balance is below a configurable minimum (\`minBalanceStroops\`).
- Print the signing account address and network before sending.

## Suggested execution
- Add checks in \`src/run.ts\` before \`doBatches\`. Add the config field in \`src/config.ts\` with validation.

## Test and commit
- Unit tests for each refusal case. Commit example: \`feat(cli): add mainnet safety checks\`

## Acceptance criteria
- [ ] Mainnet execute without \`--yes-mainnet\` exits with a clear error
- [ ] Low balance blocks sending
- [ ] README safety section updated

$GUIDE
EOF2

create_issue "feat(alerts): avoid sending the same alert repeatedly" "medium,area:alerts" <<EOF2
## Description
A scheduled run can send the same warning every day. Add de-duplication.

## Requirements and context
- Store a small state file (path configurable) with the last alert time per entry and state.
- Only re-alert when the state changes or after a configurable window (\`alertCooldownHours\`).
- Default must keep today's behavior if no state path is set.

## Suggested execution
- New \`src/alert-state.ts\`. Use it in \`buildMessage\` flow in \`src/cli.ts\`.

## Test and commit
- Unit tests with a temp directory. Commit example: \`feat(alerts): add alert cooldown\`

## Acceptance criteria
- [ ] Same problem does not alert twice inside the window
- [ ] A changed state alerts immediately
- [ ] Works when the state file does not exist yet

$GUIDE
EOF2

create_issue "feat(config): read the network's max TTL and cap extendToLedgers" "medium,area:tx" <<EOF2
## Description
If \`extendToLedgers\` is above the network maximum, extend transactions fail. Read the limit from the network and cap or warn.

## Requirements and context
- Find where the current state archival settings (maximum entry TTL) can be read. Verify it in the current Stellar docs and say so in the PR. Do not guess the value.
- If the configured value is higher, cap it and print a warning.

## Suggested execution
- New helper in \`src/scan.ts\` or a new \`src/network-settings.ts\`. Call before extending.

## Test and commit
- Mocked RPC unit tests. Commit example: \`feat(tx): cap extendTo to network max TTL\`

## Acceptance criteria
- [ ] Value is read from the network, not hard-coded
- [ ] Warning is shown when capped
- [ ] Documented in README

$GUIDE
EOF2

create_issue "feat(config): load the signing key from a file or command" "medium,area:cli" <<EOF2
## Description
Some teams do not want secrets in environment variables. Support other secure sources.

## Requirements and context
- Add \`secretFile\` (path) and \`secretCommand\` (a command whose stdout is the key) as alternatives to \`secretEnv\`.
- Only one source may be set. Never log the key. Refuse a key file that is readable by other users on Unix.

## Suggested execution
- New \`src/secrets.ts\`, used by \`src/cli.ts\`.

## Test and commit
- Unit tests for each source and for conflicting settings. Commit example: \`feat(config): add secret file and command sources\`

## Acceptance criteria
- [ ] Each source works
- [ ] Key never appears in output or errors
- [ ] README security notes updated

$GUIDE
EOF2

create_issue "feat(metrics): expose remaining TTL as Prometheus metrics" "medium,area:infra" <<EOF2
## Description
Teams that run dashboards want TTL per entry as a metric.

## Requirements and context
- With \`perennial watch\` or a new \`perennial metrics\` command, serve \`/metrics\` in Prometheus text format.
- Gauge: remaining ledgers per entry, labels: contract, kind, item, durability.
- Gauge: entries by state.

## Suggested execution
- Small HTTP server using Node's built-in \`http\`. Avoid heavy dependencies unless justified in the PR.

## Test and commit
- Unit test the text output. Commit example: \`feat(metrics): add Prometheus endpoint\`

## Acceptance criteria
- [ ] \`curl localhost:<port>/metrics\` returns valid Prometheus text
- [ ] Docs include a sample scrape config

$GUIDE
EOF2

create_issue "fix(scan): retry RPC calls on timeouts and TRY_AGAIN_LATER" "medium,area:tx" <<EOF2
## Description
Transient RPC errors currently fail the whole run. Add limited retries with backoff.

## Requirements and context
- Retry reads and sends on network errors and when the RPC says to try again later.
- Configurable \`maxRetries\` (default 3) and exponential backoff.
- Do not retry a transaction that was already accepted. Be careful about duplicate sends.

## Suggested execution
- Small \`withRetry\` helper used in \`src/scan.ts\` and \`src/tx.ts\`.

## Test and commit
- Unit tests with fake timers and failing mocks. Commit example: \`fix(scan): add retry with backoff\`

## Acceptance criteria
- [ ] Transient failures recover
- [ ] Permanent failures still fail fast with a clear error
- [ ] No duplicate transaction sends in tests

$GUIDE
EOF2

create_issue "chore(docker): add Dockerfile and compose example" "medium,area:infra" <<EOF2
## Description
Let people run Perennial as a container with a mounted config.

## Requirements and context
- Multi-stage build, runs as a non-root user, small final image.
- Example \`docker-compose.yml\` with the config mounted read-only and the secret passed as an environment variable.
- Document in README.

## Suggested execution
- \`Dockerfile\`, \`.dockerignore\`, \`examples/docker-compose.yml\`.

## Test and commit
- Show \`docker build\` and a \`scan\` run in the PR. Commit example: \`chore(docker): add Dockerfile\`

## Acceptance criteria
- [ ] Image builds from a clean checkout
- [ ] Container runs \`scan\` with a mounted config
- [ ] README section added

$GUIDE
EOF2

# ---------- TRIVIAL ----------
create_issue "docs(config): publish a JSON schema for the config file" "trivial,area:docs" <<EOF2
## Description
Add \`perennial.schema.json\` so editors can validate and autocomplete the config.

## Requirements and context
- Cover every field in \`src/config.ts\` and \`src/types.ts\`, including the key types.
- Reference it from \`perennial.config.example.json\` with \`"\$schema"\`.

## Suggested execution
- Write the schema by hand. Make sure \`parseConfig\` ignores the \`\$schema\` field.

## Test and commit
- Add a test that validates the example config against the schema. Commit example: \`docs(config): add JSON schema\`

## Acceptance criteria
- [ ] Example config validates
- [ ] Schema rejects a config with a bad durability value

$GUIDE
EOF2

create_issue "feat(cli): add perennial init to write an example config" "trivial,area:cli" <<EOF2
## Description
\`perennial init\` should write a starter \`perennial.config.json\`.

## Requirements and context
- Never overwrite an existing file unless \`--force\` is passed.
- Ask for nothing interactively. Use flags: \`--network\`, \`--contract <id>\`.
- Output must pass \`parseConfig\`.

## Suggested execution
- New command in \`src/cli.ts\`.

## Test and commit
- Unit test in a temp directory. Commit example: \`feat(cli): add init command\`

## Acceptance criteria
- [ ] Creates a valid file
- [ ] Refuses to overwrite without \`--force\`

$GUIDE
EOF2

create_issue "feat(cli): add --quiet flag and clearer output" "trivial,area:cli" <<EOF2
## Description
Make CLI output easier to read in terminals and quieter in CI.

## Requirements and context
- \`--quiet\` prints only problems and actions.
- Add a one-line summary at the end (counts per state).
- Do not change the \`--json\` output.

## Suggested execution
- Edit the print section of \`src/cli.ts\`. Keep colors optional and off when stdout is not a terminal.

## Test and commit
- Unit test the summary formatter. Commit example: \`feat(cli): add --quiet and summary line\`

## Acceptance criteria
- [ ] Summary line shown by default
- [ ] \`--quiet\` hides ok entries
- [ ] JSON output unchanged

$GUIDE
EOF2

create_issue "docs(action): add a GitHub Action walkthrough with a testnet example" "trivial,area:docs" <<EOF2
## Description
Write a step-by-step guide to running Perennial on a schedule with GitHub Actions.

## Requirements and context
- Cover: creating a funded testnet account, adding the \`PERENNIAL_SECRET\` secret, the workflow file, reading the logs, switching from dry run to execute.
- Use real commands you ran. Say which versions you used.

## Suggested execution
- New \`docs/GITHUB-ACTION.md\`, linked from the README.

## Test and commit
- Follow your own guide on a fresh repo and note any problems. Commit example: \`docs(action): add walkthrough\`

## Acceptance criteria
- [ ] A new user can follow it end to end
- [ ] README links to it

$GUIDE
EOF2

echo "Done. (DRY_RUN=$DRY_RUN)"
