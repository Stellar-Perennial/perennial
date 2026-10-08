# Local setup

This page gets you from a fresh clone to a built, tested Perennial, and shows how to deploy the fixture contract to testnet.

Tested with: Node v22.22.1, npm 9.2.0.

## Clone, install, build, test

```bash
git clone https://github.com/stellar-Perennial/perennial.git
cd perennial
npm install
npm run typecheck
npm test
npm run build
```

- `npm run typecheck` runs `tsc --noEmit`.
- `npm test` runs the unit tests with vitest.
- `npm run build` compiles to `dist/`, including `dist/cli.js`.

The repo requires Node >= 20 (`engines` in `package.json`). VitePress, used for this docs site, requires Node >= 22 (see the [VitePress docs](https://vitepress.dev/guide/getting-started)).

## Try it locally

```bash
cp perennial.config.example.json perennial.config.json
# edit perennial.config.json: set a real contract ID
node dist/cli.js scan --config perennial.config.json
```

`scan` is read-only and safe to point anywhere. See [Getting started](/guide/getting-started).

## Deploy the fixture contract to testnet

The fixture contract (`fixtures/contract`) writes one value into each storage type. It is for testing Perennial, not for production.

The Rust contract uses `soroban-sdk` (see `fixtures/contract/Cargo.toml`). To deploy it you need the Stellar CLI and Rust. **Unverified: run these once yourself before relying on them; the exact current CLI commands should be checked against the official docs at [developers.stellar.org](https://developers.stellar.org/docs/build/scripts/cli).** The general flow is:

```bash
# from the repo root
cd fixtures/contract
soroban contract build        # or: stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/contract.wasm \
  --network testnet \
  --source <YOUR_ACCOUNT_ALIAS>
```

After deploying you get a contract ID starting with `C`. Put it in `perennial.config.json`, then call the fixture's functions to create storage entries:

```bash
stellar contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --network testnet \
  --source <YOUR_ACCOUNT_ALIAS> \
  put_persistent --key a --value 1
```

Then run `node dist/cli.js scan` to see the instance, code, and persistent key entries with their TTLs. Let them lapse (or lower `thresholdLedgers` in a scratch config) to see the `expiring` and `expired` states.

## Docs site (this site)

```bash
cd docs-site
npm install
npm run docs:dev     # dev server at http://localhost:5173
npm run docs:build   # production build
npm run docs:preview # preview the build at http://localhost:4173
```

The site is configured with `base: "/perennial/"` and deploys to GitHub Pages via `.github/workflows/docs.yml`.
