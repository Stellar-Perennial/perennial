# Contributing

This page explains how to set up, the contribution rules, and how the Drips Wave points work.

This page summarizes `CONTRIBUTING.md` at the repo root. That file is the source of truth.

## Setup

```bash
npm install
npm run typecheck
npm test
npm run build
```

Read `docs/TTL-BASICS.md` before changing anything TTL-related.

## Rules

- **Ask to be assigned** on the issue before you start. Do not open a PR for an unassigned issue.
- One issue per PR. Put `Closes #<issue number>` in the PR description.
- Add or update tests for behavior you change. Explain how you checked it, and on which network.
- Use conventional commits: `type(scope): description`, for example `feat(scan): add retry on RPC timeout`.
- You must understand and be able to explain the code you submit. Untested or unexplained AI-generated changes will be closed.
- Never commit secret keys, tokens, or real config files.

## Drips Wave notes

Perennial participates in a Drips Wave. How it works:

- Issues are tagged with a complexity and points: **Trivial (100 points)**, **Medium (150)**, **High (200)**.
- The maintainer decides complexity and re-tags honestly before publishing each issue.
- Points are awarded when the issue is closed as completed during an active Wave.
- Before you start: ask to be assigned on the issue. In your PR description, write `Closes #id` so the issue closes with the merge.

The current planned work is the 15-issue backlog in `docs/PLANNED-ISSUES.md`: key discovery from ledger activity (High), a testnet end-to-end test (High), daemon mode (High), and a range of Medium and Trivial items. See the [Roadmap](/roadmap) page for the full list with links.

## PR checklist

1. Assigned to the issue.
2. `Closes #id` in the PR description.
3. Tests added or updated.
4. `npm run typecheck` and `npm test` pass.
5. Conventional commit messages.
6. You can explain every line of your diff.
