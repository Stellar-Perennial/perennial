# Security

This page explains how to report a vulnerability and what the security scope of Perennial is.

Perennial can sign and send transactions with a key you give it. Treat that key as sensitive.

This page summarizes `SECURITY.md` at the repo root. That file is the source of truth.

## Reporting a vulnerability

Do not open a public issue. Use GitHub's private vulnerability reporting on this repository (Security tab, "Report a vulnerability").

## Scope

Bugs that could:

- leak a secret key,
- send unintended transactions,
- bypass the fee ceiling,
- bypass dry-run mode.

## Audit status

Perennial has **not** been audited. Use a dedicated low-balance account and test on testnet first. See [Safety](/guide/safety) for the practices Perennial enforces in code (dry run by default, env-only secrets, fee ceiling before signing).
