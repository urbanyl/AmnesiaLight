#!/usr/bin/env bash
# =========================================================================
#  AmnesiaLight launcher (Linux)
#  Starts the browser with the AmnesiaLight profile.
#  Default: normal window (session kept). Pass --private for a private window.
# =========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="$ROOT/profile"

# Par defaut : fenetre normale. Options : --private / -p (fenetre privee).
MODE=""
case "${1:-}" in
  --private|-p) MODE="--private-window" ;;
esac

ENGINE=""
for c in \
  "$ROOT/engine/amnesialight" \
  "$ROOT/engine/firefox" \
  "/usr/lib/amnesialight/amnesialight" \
  "/opt/amnesialight/amnesialight" \
  "$(command -v amnesialight 2>/dev/null || true)"; do
  if [ -n "$c" ] && [ -x "$c" ]; then ENGINE="$c"; break; fi
done

if [ -z "$ENGINE" ]; then
  echo
  echo "  AmnesiaLight - moteur introuvable."
  echo "  Placez le binaire dans : $ROOT/engine/amnesialight"
  echo
  exit 1
fi

echo "  AmnesiaLight  -  profil : $PROFILE"
if [ -n "$MODE" ]; then echo "  Mode : fenetre privee (aucune trace)."; else echo "  Mode : fenetre normale."; fi

# Sync policies next to the engine (DuckDuckGo default + hardening)
mkdir -p "$ROOT/engine/distribution"
if [ -f "$ROOT/distribution/policies.json" ]; then
  cp -f "$ROOT/distribution/policies.json" "$ROOT/engine/distribution/policies.json"
fi

exec "$ENGINE" -profile "$PROFILE" -no-remote $MODE "$@"
