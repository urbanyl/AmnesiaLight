#!/usr/bin/env bash
# =========================================================================
#  AmnesiaLight panic wipe (Linux)
#  Removes every trace from the profile while keeping theme and settings.
# =========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="$ROOT/profile"

echo "Effacement des traces dans : $PROFILE"
find "$PROFILE" -mindepth 1 -maxdepth 1 \
  ! -name chrome ! -name search ! -name user.js -exec rm -rf {} +
echo "Termine. Toutes les traces ont ete effacees."
