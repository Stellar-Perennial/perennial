# Troubleshooting

This page lists common failures, what they mean, and what is still unverified in Perennial.

Status: **early alpha, not yet tested against a live network.** If you hit something not listed here, please open an issue with the command, the output, and the network.

## Missing entries (`missing` state)

`missing` means the RPC returned no ledger entry for a key you listed. Two usual causes:

1. **The key is wrong.** The durability or the key value in the config does not match what the contract wrote. A `vec` key must match the Rust enum or tuple shape exactly: a `DataKey::Balance(Address)` key is a vector of the symbol `Balance` and the address. Re-check the contract source and [Configuration](/guide/configuration#key-types).
2. **The entry is archived and evicted.** A persistent entry archived long enough may no longer be returned by RPC. Run with `--include-missing` (`run` or `restore`) to attempt a restore.

Temporary entries that expired cannot be restored; they stay `missing`.

## Fee above ceiling

```
Fee 6000000 stroops is above maxFeeStroops (5000000). Nothing was sent.
```

The simulated fee exceeded `maxFeeStroops`. The transaction was **not** sent and **not** signed. Options: raise `maxFeeStroops` if the fee is legitimate, or reduce `batchSize` (fewer entries per transaction usually means a smaller resource fee). See [Safety](/guide/safety).

## Extend above max TTL

If `extendToLedgers` is higher than the network's maximum TTL, the transaction fails on the network and the action is reported as `failed` with the network error. Perennial does not currently read the network maximum (that is [planned](https://github.com/stellar-Perennial/perennial)). The default of 518400 (about 30 days) is chosen below documented persistent-entry maximums. **Unverified: the exact current maximum TTL values per durability. Check the official [State archival docs](https://developers.stellar.org/docs/learn/smart-contract-internals/state-archival) before raising `extendToLedgers`.**

## RPC errors

- **Connection refused / DNS failure**: wrong `rpcUrl`. On `network: "testnet"` the default is `https://soroban-testnet.stellar.org`; otherwise you must set `rpcUrl` yourself.
- **`TRY_AGAIN_LATER` or timeouts**: the RPC is throttling or overloaded. Perennial does not retry automatically (a [planned issue](https://github.com/stellar-Perennial/perennial) covers retry and backoff). Re-run later.
- **Transaction rejected**: the action result shows the raw error from `sendTransaction`. Common causes: sequence number changed (another transaction was sent from the same account in between), or insufficient balance for the fee.

## Bad key encoding

Errors like `Unsupported key type` come from `src/scval.ts` when a `key.type` is not one of `symbol`, `string`, `bool`, `u32`, `u64`, `i128`, `address`, `vec`, `xdr`. An invalid contract ID is rejected at config load with `contracts[i].id is not a valid contract ID (starts with "C")`. An invalid base64 `xdr` value fails when the ScVal is decoded.

## Config errors

Config problems are printed as `Config error: ...`. The common ones:

- `"rpcUrl" is required unless network is "testnet"` — set `rpcUrl` for `mainnet` and `custom`.
- `"networkPassphrase" is required for a custom network`.
- `"extendToLedgers" must be larger than "thresholdLedgers"`.
- `"contracts" must be a non-empty array`.

## Exit code 2 in CI or the Action

Exit code 2 is not a crash. It means the scan worked and something needs attention. A scheduled dry run with `expiring` entries will show as a failed job; that is the intended signal. See [CLI](/guide/cli#exit-codes) and [GitHub Action](/guide/github-action#step-5-read-the-logs).

## What is still unverified

Copied from the README's "What to verify first". This code was written without access to a live network, so these points are **unverified**:

1. `npm install` and `npm run build` succeed with the current `@stellar/stellar-sdk`. Dependency versions are open ranges. Pin them after your first successful install.
2. How the RPC reports entries that are expired but not yet evicted, and entries that are fully archived (this decides `expired` vs `missing`).
3. The maximum TTL the network allows. If `extendToLedgers` is too high the transaction will fail.
4. Restore then extend works end to end on testnet using `fixtures/contract`.
5. Whether a public mainnet RPC endpoint suits you. Set `rpcUrl` yourself.
