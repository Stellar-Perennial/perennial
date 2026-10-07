# Contributing to Perennial

Thanks for helping. Read `docs/TTL-BASICS.md` first.

## Setup
```bash
npm install
npm run typecheck
npm test
npm run build
```

## Rules
- **Ask to be assigned** on the issue before you start. Do not open a PR for an unassigned issue.
- One issue per PR. Put `Closes #<issue number>` in the PR description.
- Add or update tests for behavior you change. Explain how you checked it, and on which network.
- Use conventional commits: `type(scope): description`, for example `feat(scan): add retry on RPC timeout`.
- You must understand and be able to explain the code you submit. Untested or unexplained AI-generated changes will be closed.
- Never commit secret keys, tokens, or real config files.

## Wave contributors
Issues are tagged with a complexity and points. The maintainer decides complexity. Points are awarded when the issue is closed as completed during an active Wave.
