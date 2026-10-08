# GitHub Action

This page shows how to run Perennial on a schedule in GitHub Actions, from a funded testnet account to your first executed run.

Perennial ships two things for this:

- `action.yml` at the repo root: a composite action that builds Perennial and runs one command.
- `examples/perennial-schedule.yml`: a workflow you copy into the repo that owns the contracts.

## Step 1: Fund a dedicated testnet account

Create an account you use only for Perennial, fund it on testnet, and keep its balance small. The Stellar docs explain how to get testnet XLM ([developers.stellar.org/docs/testnet](https://developers.stellar.org/docs/testnet)). Do not use a treasury or admin key. See [Safety](/guide/safety).

## Step 2: Add the `PERENNIAL_SECRET` repository secret

In the repo that owns the contracts: Settings, Secrets and variables, Actions, New repository secret.

- Name: `PERENNIAL_SECRET` (this matches the default `secretEnv`; if you changed `secretEnv` in the config, use that name).
- Value: the funded account's secret key (`S...`).

Never commit the secret or put it in the config file.

## Step 3: Add the config

Copy `perennial.config.example.json` to `perennial.config.json` in that repo and edit it. See [Configuration](/guide/configuration). Commit the config; it contains no secrets.

## Step 4: Add the workflow

Copy `examples/perennial-schedule.yml` into your repo's `.github/workflows/`. The file is:

```yaml
name: Perennial keeper
on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:
jobs:
  keep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: stellar-Perennial/perennial@main
        with:
          config: perennial.config.json
          mode: run
          execute: "false"
        env:
          PERENNIAL_SECRET: ${{ secrets.PERENNIAL_SECRET }}
```

This runs `run` every day at 06:00 UTC. `execute: "false"` means dry run: the action scans and prints what it would do, and sends no transactions. You can also trigger it manually from the Actions tab (workflow_dispatch).

The action accepts the same inputs as the CLI: `config` (path), `mode` (`scan`, `run`, `extend`, `restore`), and `execute` (`"true"` to send transactions).

## Step 5: Read the logs

Open the workflow run and read the "Run Perennial" step. In dry run you will see lines like:

```
Dry run: nothing was sent. Use --execute to send transactions.

Latest ledger: 1800000
[ok] my-contract: instance, 200000 ledgers left (~11.6 days)
restore: 1 entries, dry-run
extend: 1 entries, dry-run
```

The step fails (exit code 2) when any entry needs attention, so a dry run with `expiring` entries shows as a failed job. That is expected and is what tells you the tool is working. Exit code 1 means a real error, usually a bad config.

## Step 6: Switch from dry run to execute

When the dry-run output looks right for several scheduled runs:

1. Edit your workflow file and change `execute: "false"` to `execute: "true"`.
2. Commit and push.
3. Trigger it manually first (workflow_dispatch) and watch the run.

With `execute: "true"` the action restores expired entries and extends expiring ones for real, spending fees from the funded account. The fee ceiling `maxFeeStroops` still applies: a transaction above the ceiling is not sent. See [Safety](/guide/safety).

Keep `execute: "false"` until you have personally confirmed the dry-run output matches what you expect. Perennial is early alpha and untested against a live network.

## Alerts in Actions

The action passes the whole environment through, so alert variables like `SLACK_WEBHOOK_URL` work the same way: add them as repository secrets and map them in the `env:` block, as done for `PERENNIAL_SECRET` above. See [Alerts](/guide/alerts).
