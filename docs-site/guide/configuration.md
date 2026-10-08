# Configuration

This page lists every config field, every key type for data keys, and a complete example config.

The config is a JSON file. The default path is `perennial.config.json`; change it with `--config FILE`. Validation happens in `src/config.ts`. A template is in `perennial.config.example.json` at the repo root.

## Top-level fields

| Field | Type | Required | Default | What it does |
| --- | --- | --- | --- | --- |
| `network` | `"testnet"` \| `"mainnet"` \| `"custom"` | yes | — | Which network to talk to. |
| `rpcUrl` | string | yes unless `network` is `"testnet"` | `https://soroban-testnet.stellar.org` on testnet | Soroban RPC endpoint. |
| `networkPassphrase` | string | yes if `network` is `"custom"` | — | Passphrase for a custom network. |
| `thresholdLedgers` | positive integer | no | `120960` (about 7 days) | Act when fewer than this many ledgers remain. |
| `extendToLedgers` | positive integer | no | `518400` (about 30 days) | Extend TTL to this many ledgers from now. Must be larger than `thresholdLedgers`. |
| `maxFeeStroops` | positive integer | no | `5000000` | Abort a transaction if its fee after simulation is above this. |
| `batchSize` | positive integer | no | `20` | Ledger entries per transaction. |
| `secretEnv` | string | no | `"PERENNIAL_SECRET"` | Name of the environment variable holding the funded account's secret key (`S...`). |
| `contracts` | array | yes | — | Contracts to watch. Must be non-empty. |
| `alerts` | object | no | — | Alert channels. See [Alerts](/guide/alerts). |

Day counts are estimates: Perennial uses a fixed 5 seconds per ledger. Real close times vary.

## Contract fields

| Field | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | — | Contract ID, must start with `C`. Validated with the SDK's `StrKey.isValidContract`. |
| `label` | string | the contract ID | Name shown in output and alerts. |
| `watchInstance` | boolean | `true` | Scan the contract instance entry. |
| `watchCode` | boolean | `true` | Scan the wasm code entry (hash is read from the instance). |
| `keys` | array | `[]` | Data keys to watch. See below. |

## Data keys

Soroban RPC cannot list a contract's storage keys; it can only fetch keys you name. Perennial can find the instance and code entries on its own (the instance key is derived from the contract ID, the code hash from the instance), but **data keys must be listed by hand** in the config. Automatic key discovery is a [planned issue](https://github.com/stellar-Perennial/perennial).

Each entry in `keys` has:

| Field | Type | What it does |
| --- | --- | --- |
| `label` | string | Optional name shown in output. |
| `durability` | `"persistent"` \| `"temporary"` | Which storage the key lives in. Required. |
| `key` | object | The key value, described as JSON. Required. |

### Key types

The `key` object has a `type` and a `value`. Supported types (from `src/scval.ts`):

| Type | Value shape | Soroban ScVal |
| --- | --- | --- |
| `symbol` | string | `ScSymbol` |
| `string` | string | `ScString` |
| `bool` | boolean | `ScBool` |
| `u32` | number | `ScU32` |
| `u64` | number or string | `ScU64` |
| `i128` | number or string | `ScI128` |
| `address` | `G...` or `C...` string | `ScAddress` |
| `vec` | array of key objects | `ScVec` |
| `xdr` | base64 XDR string | any ScVal, decoded from base64 |

For anything the listed types cannot express, use `xdr` with a base64-encoded `ScVal`.

### Worked example: a `DataKey::Balance(address)` key

A common Soroban pattern is a Rust enum key like:

```rust
pub enum DataKey {
    Balance(Address),
}
```

The SDK encodes that as a vector of two values: the symbol `Balance` and the address. In the Perennial config:

```json
{
  "label": "balance of one account",
  "durability": "persistent",
  "key": {
    "type": "vec",
    "value": [
      { "type": "symbol", "value": "Balance" },
      { "type": "address", "value": "G_REPLACE_WITH_AN_ACCOUNT" }
    ]
  }
}
```

Replace `G_REPLACE_WITH_AN_ACCOUNT` with the real account address. A key like `Admin` alone would be `{ "type": "symbol", "value": "Admin" }`.

## Complete example

This is `perennial.config.example.json` from the repo:

```json
{
  "network": "testnet",
  "thresholdLedgers": 120960,
  "extendToLedgers": 518400,
  "maxFeeStroops": 5000000,
  "batchSize": 20,
  "secretEnv": "PERENNIAL_SECRET",
  "contracts": [
    {
      "id": "C_REPLACE_WITH_YOUR_CONTRACT_ID",
      "label": "my-contract",
      "watchInstance": true,
      "watchCode": true,
      "keys": [
        {
          "label": "admin",
          "durability": "persistent",
          "key": { "type": "vec", "value": [{ "type": "symbol", "value": "Admin" }] }
        },
        {
          "label": "balance of one account",
          "durability": "persistent",
          "key": {
            "type": "vec",
            "value": [
              { "type": "symbol", "value": "Balance" },
              { "type": "address", "value": "G_REPLACE_WITH_AN_ACCOUNT" }
            ]
          }
        }
      ]
    }
  ],
  "alerts": {
    "slack": { "webhookUrlEnv": "SLACK_WEBHOOK_URL" },
    "telegram": { "botTokenEnv": "TELEGRAM_BOT_TOKEN", "chatIdEnv": "TELEGRAM_CHAT_ID" },
    "webhook": { "urlEnv": "PERENNIAL_WEBHOOK_URL" }
  }
}
```

The `alerts` values are the names of environment variables; Perennial reads the actual URLs and tokens from those variables at runtime. See [Alerts](/guide/alerts).
