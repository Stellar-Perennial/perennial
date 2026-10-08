---
layout: home

hero:
  name: "Perennial"
  text: "Keep your Soroban state alive"
  tagline: Watch contract storage TTLs, get warned before entries expire, and extend or restore them on a schedule.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: What is Perennial?
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/stellar-Perennial/perennial

---

<script setup>
import { withBase } from "vitepress";
</script>

<div class="status-banner">
<strong>Status: early alpha.</strong> Perennial has not been tested against a live network. Read <a href="/perennial/guide/troubleshooting.html">Troubleshooting</a> before pointing it at mainnet. Perennial is an independent community project. It is not an official Stellar Development Foundation product.
</div>

<p align="center">
  <img src="/banner.png" alt="Perennial: keep your Soroban state alive" width="100%">
</p>

## What is Perennial?

Soroban contract data expires unless someone pays to extend it. Expired data is archived, and your app can break until it is restored. Perennial watches the storage of the contracts you list, warns before entries run out, and extends or restores them on a schedule.

## What it does

| Feature | Description |
| --- | --- |
| Scan | Reads the TTL of a contract's instance, wasm code, and data keys you list. Reports each as `ok`, `expiring`, `expired`, or `missing`. |
| Act | Restores expired entries and extends expiring ones. Dry run by default; `--execute` sends transactions. |
| Alert | Sends alerts to Slack, Telegram, or any webhook. Secrets come from environment variables. |
| Automate | Runs from the command line or as a scheduled GitHub Action. |

## Install and first command

Requires Node 20 or newer.

```bash
npm install
npm run build
cp perennial.config.example.json perennial.config.json   # then edit it
node dist/cli.js scan
```

`scan` only reads. It exits with code `2` if anything needs attention.

Next: [Getting started](/guide/getting-started) or [Configuration](/guide/configuration).
