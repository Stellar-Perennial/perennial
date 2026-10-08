# Safety

This page lists the safety properties built into Perennial and the practices you should follow.

## What the code enforces

### Dry run by default

`run`, `extend`, and `restore` never send anything unless you pass `--execute`. In a dry run, Perennial does not even need a secret key. The GitHub Action also defaults to `execute: "false"`.

### Fee ceiling checked after simulation, before signing

Every transaction is simulated first (`server.prepareTransaction`). After simulation and **before signing**, Perennial compares the fee against `maxFeeStroops`. If the fee is above the ceiling, the transaction is abandoned and nothing is sent. The error names both values:

```
Fee 6000000 stroops is above maxFeeStroops (5000000). Nothing was sent.
```

`maxFeeStroops` defaults to `5000000` stroops (0.5 XLM). Note the ceiling applies per transaction, and a batch contains up to `batchSize` entries.

### Secrets only from the environment

The signing key is read from the single environment variable named by `secretEnv` (default `PERENNIAL_SECRET`). It is never read from the config file. Alert webhook URLs and bot tokens are also read only from environment variables. The example config and the docs never contain a real secret.

### Restore is its own transaction, then extend

A restore cannot be combined with other operations. Perennial sends each restore batch as its own `RestoreFootprint` transaction, then sends `ExtendFootprintTtl` transactions afterwards. Entries whose restore failed are excluded from the extend step, so a failed restore cannot produce a bogus extend.

## What you should do

### Use a dedicated low-balance account

Give Perennial an account that holds only what it needs to pay fees. Not a treasury, not an admin key, not your main account. If the key leaks or the tool misbehaves, the loss is capped at that balance. Top it up as needed.

### Test on testnet first

Perennial is **early alpha and not yet tested against a live network**. Verify the full loop (scan, dry run, execute) on testnet before trusting it anywhere else. See [What is still unverified](/guide/troubleshooting#what-is-still-unverified).

### Keep the fee ceiling meaningful

Set `maxFeeStroops` to a value you would actually accept paying per transaction. A ceiling far above normal fees will not protect you from much; a ceiling near normal fees will stop runaway resource fees.

### Read dry-run output before executing

Compare the listed entries and planned actions against what you expect for your contracts. The GitHub Action flow makes this easy: run scheduled dry runs, read the logs, then flip `execute` to `"true"` ([GitHub Action](/guide/github-action)).

## What is not protected

- A wrong `keys` entry in the config scans the wrong key but cannot harm anything, since extend and restore only touch the entries they scanned.
- `--include-missing` restores entries the RPC did not return. If a listed key is wrong, the restore will fail and be reported; it cannot restore someone else's entry, because the ledger key embeds your contract ID.
- The fee ceiling does not cap total spending over time; each run can send multiple transactions (one per batch per action).
