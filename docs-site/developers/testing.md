# Testing

This page explains what Perennial tests today, what the fixture contract is for, and how to add tests.

## Unit tests

Unit tests live in `test/` and run with vitest:

```bash
npm test
```

Tested with vitest (open range `>=2.0.0` in `package.json`). Current coverage:

| File | What it covers |
| --- | --- |
| `test/config.test.ts` | `parseConfig`: defaults (threshold 120960, extend-to 518400, secretEnv `PERENNIAL_SECRET`), rejected networks, `rpcUrl` required on mainnet, `extendToLedgers` must exceed `thresholdLedgers`, invalid contract IDs, bad durability. |
| `test/scan.test.ts` | `classify` for all four states (`ok`, `expiring`, `expired`, `missing`) and `ledgersToDays` (17280 ledgers = 1 day at the 5 s estimate). |
| `test/scval.test.ts` | `toScVal` encoding for `u32`, `symbol`, and a `vec` of symbol + u32. |

There are no tests that touch the network. Everything network-related (RPC calls, transaction send, alert delivery) is untested; see the [unverified list](/guide/troubleshooting#what-is-still-unverified).

## The fixture contract

`fixtures/contract` is a minimal Soroban contract in Rust used to exercise Perennial:

```rust
pub fn put_persistent(env: Env, key: Symbol, value: u32)
pub fn put_temporary(env: Env, key: Symbol, value: u32)
pub fn put_instance(env: Env, key: Symbol, value: u32)
pub fn get_persistent(env: Env, key: Symbol) -> Option<u32>
```

It writes one value into each storage type, so you can create real instance, persistent, and temporary entries and watch their TTLs. It has one Rust unit test (`persistent_roundtrip`) run with `cargo test` inside `fixtures/contract`.

Deploy it to testnet with the Stellar CLI: see [Local setup](/developers/local-setup#deploy-the-fixture-contract-to-testnet).

## How to add tests

1. Add a file `test/<module>.test.ts` mirroring the module you are testing.
2. Import from `../src/...` and use `describe` / `it` / `expect` from vitest.
3. Keep tests network-free. If you need an `rpc.Server`, inject a fake or test a pure function instead. The codebase is structured for this: `classify`, `ledgersToDays`, `toScVal`, `parseConfig`, and `buildMessage` are all pure functions.
4. Run `npm test` and `npm run typecheck` before committing.

A planned issue asks for a testnet end-to-end test: deploy `fixtures/contract`, let entries lapse, run restore then extend, and assert the results. Until that lands, behavior against a live network is verified only by hand. See [Roadmap](/roadmap).

If you change behavior, add or update the test for it. PRs without tests for changed behavior are harder to accept; see [Contributing](/developers/contributing).
