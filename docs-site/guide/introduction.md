# Introduction

This page explains what Perennial is, the problem it solves, and who it is for.

## What Perennial is

Perennial is a command-line tool and GitHub Action that keeps Soroban contract storage alive. It reads the time-to-live (TTL) of the ledger entries your contract depends on, warns you before they expire, and can extend or restore them for you.

Perennial is an independent community project. It is not an official Stellar Development Foundation product.

Status: **early alpha, not yet tested against a live network.**

## The problem: expiring Soroban state

Soroban ledger entries do not live forever. Each entry has a TTL measured in ledgers. When the TTL runs out, the entry is archived and a transaction that needs it fails until the entry is restored.

This means a contract can work fine one day and break the next, even though nobody changed anything. The fix is to pay fees to extend the TTL before it expires, and to restore entries that were already archived. Perennial automates both.

For the mechanics of TTL, archival, restore and extend, see [Concepts](/guide/concepts). The official Stellar documentation covers this under "State archival" on [developers.stellar.org](https://developers.stellar.org).

## Who it is for

- Developers who run apps on Soroban and want contract storage to survive periods of low activity.
- Teams who want scheduled maintenance (a GitHub Action that scans and extends every day) instead of manual checks.
- Anyone who wants to be warned before an entry expires, in Slack, Telegram, or a webhook.

## What Perennial is not

- It is not a wallet or a key manager. You give it one funded account secret through an environment variable.
- It is not a monitoring dashboard. It reports through the CLI, JSON output, and alerts.
- It is not audited. See [Security](/security).
