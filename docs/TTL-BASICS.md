# Soroban TTL basics

Read this before changing Perennial. Check every claim against the current Stellar docs (developers.stellar.org, "State archival").

- Every Soroban storage entry has a **live-until ledger**. TTL means how many ledgers remain until then.
- There are three kinds of contract data: **instance**, **persistent**, and **temporary**.
- Contract **code** (the wasm) and the contract **instance** are also ledger entries with their own TTL.
- When a persistent entry's TTL runs out it is **archived**. It must be **restored** (RestoreFootprint operation) before a transaction can use it again.
- Temporary entries are not restorable once they expire. *(Verify in the current docs.)*
- **Extending** a TTL uses the ExtendFootprintTtl operation. The `extendTo` value counts ledgers from now, and it cannot exceed the network maximum.
- A restore transaction must be sent on its own, then you extend.
- Perennial treats `remaining = liveUntilLedger - latestLedger`. `remaining <= 0` is `expired`. Below the threshold is `expiring`. No entry returned is `missing`.

## Questions to answer in your own words

1. What happens to a persistent entry when its TTL runs out, and what must happen before it can be used again?
2. Why can Perennial find a contract's instance and code automatically but not its data keys?
3. Why does `run` default to a dry run?
