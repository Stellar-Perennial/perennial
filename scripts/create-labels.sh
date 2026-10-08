#!/usr/bin/env bash
# Creates the labels used by the planned issues. Safe to re-run.
# Usage: REPO=stellar-Perennial/perennial ./scripts/create-labels.sh
set -euo pipefail
REPO="${REPO:-stellar-Perennial/perennial}"

mk() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force; }

mk "trivial"  "C2E0C6" "Small, clearly bounded change (100 points)"
mk "medium"   "FBCA04" "Touches several parts of the codebase (150 points)"
mk "high"     "D93F0B" "Integration or architectural change (200 points)"
mk "area:scan"   "1D76DB" "TTL scanning and classification"
mk "area:tx"     "1D76DB" "Building and sending transactions"
mk "area:alerts" "1D76DB" "Slack, Telegram, webhook alerts"
mk "area:cli"    "1D76DB" "Command line interface"
mk "area:docs"   "0E8A16" "Documentation"
mk "area:infra"  "5319E7" "CI, Docker, packaging"
echo "Labels created on $REPO"
echo "Reminder: the Drips Wave program label (for example 'Stellar Wave') only works after your repo is approved."
