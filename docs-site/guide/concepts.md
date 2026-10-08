# Concepts

This page explains the Soroban TTL concepts Perennial is built on, and how Perennial classifies entries.

Sources: the official Stellar developer docs, [State archival](https://developers.stellar.org/docs/learn/smart-contract-internals/state-archival) and [Storage](https://developers.stellar.org/docs/learn/smart-contract-internals/persistent-temporary-entries). Read those pages for details; this page only summarizes what Perennial relies on.

## Storage types

A Soroban contract can store data in three kinds of contract storage. Perennial documents them as it scans:

- **Instance**: the contract instance entry. Created at deployment, holds the contract executable reference and instance storage.
- **Persistent**: entries that should survive as long as the contract is used, but expire when unused. They can be restored.
- **Temporary**: entries with short TTLs. When a temporary entry expires it is gone; Perennial treats it as `missing` once the RPC stops returning it. (Unverified: exact archival behavior for temporary entries. Check the [official docs](https://developers.stellar.org/docs/learn/smart-contract-internals/state-archival).)

## Code and instance are entries too

Contract **code** (the deployed wasm) and the contract **instance** are ledger entries with their own TTLs, separate from the data entries. If the code entry expires, the contract itself cannot be invoked until it is restored. Perennial always scans the instance (unless `watchInstance` is false), and scans the code entry by reading the wasm hash out of the instance entry.

## Archive, restore, extend

- When a persistent entry's TTL reaches zero it is **archived**. It stays in state but a transaction that tries to use it fails until the entry is restored. See [State archival](https://developers.stellar.org/docs/learn/smart-contract-internals/state-archival).
- **Restoring** an archived entry uses the `RestoreFootprint` operation and costs fees. A restore must be sent in its own transaction; it cannot be combined with an extend in the same transaction.
- **Extending** a TTL uses the `ExtendFootprintTtl` operation. The `extendTo` value counts ledgers from now. There is a network maximum TTL; extending past it will fail. Perennial does not read the maximum automatically (that is a [planned issue](https://github.com/stellar-Perennial/perennial/issues)). The default `extendToLedgers` of 518400 is about 30 days, which is below the current maximums documented for persistent entries. (Unverified: exact current maximum TTL value. Check the [official docs](https://developers.stellar.org/docs/learn/smart-contract-internals/state-archival) before relying on it.)

## How Perennial computes remaining TTL

For each entry it scans, Perennial asks the Soroban RPC for the entry's `liveUntilLedgerSeq` and for the network's `latestLedger`:

```
remaining = liveUntilLedger - latestLedger
```

`remaining` is the number of ledgers left before the entry expires.

## The four states

Perennial classifies each entry into one of four states:

| State | Meaning | Rule (from `src/scan.ts`, `classify`) |
| --- | --- | --- |
| `ok` | Nothing to do | `remaining >= thresholdLedgers` |
| `expiring` | Under the threshold, act soon | `0 < remaining < thresholdLedgers` |
| `expired` | TTL reached zero | `remaining <= 0` |
| `missing` | RPC returned no entry | entry not found (archived and evicted, or the key is wrong) |

`thresholdLedgers` defaults to `120960`. `extendToLedgers` defaults to `518400`. Both are estimates based on about 5 seconds per ledger; real close times vary.

## Worked example with the defaults

Assume the default `thresholdLedgers = 120960` (about 7 days at ~5 s/ledger).

| Entry | liveUntilLedger | latestLedger | remaining | State |
| --- | --- | --- | --- | --- |
| A | 2,000,000 | 1,800,000 | 200,000 | `ok` (above 120,960) |
| B | 1,900,000 | 1,800,000 | 100,000 | `expiring` (under the threshold) |
| C | 1,800,000 | 1,800,000 | 0 | `expired` |
| D | (not returned) | 1,800,000 | — | `missing` |

Days are estimates: `ledgersToDays` in `src/scan.ts` uses a fixed 5 seconds per ledger, so 100,000 ledgers is reported as about 5.8 days. Actual close times vary, so treat these numbers as rough.

When you run `perennial run`, Perennial restores `expired` entries (and `missing` ones only with `--include-missing`), then extends `expiring` and `expired` entries to `extendToLedgers` from now. See [CLI](/guide/cli) and [Safety](/guide/safety).
