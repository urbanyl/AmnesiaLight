#!/usr/bin/env bash
# =============================================================================
#  AmnesiaLight portable packager (Linux / macOS)
#  Bash equivalent of tools/package-portable.ps1.
#
#  Builds a self-contained archive from the repository:
#  engine + profile + distribution policy + launch scripts + icons + LICENSE
#  + README.md, plus a top-level launcher.
#
#  Output: <root>/dist/AmnesiaLight-<version>-portable-linux-x64.tar.gz
#
#  Usage:
#    bash tools/package-portable.sh [--version 0.2.0] [--root /path/to/repo]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION=""

while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="${2:-}"; shift 2 ;;
    --root)    ROOT="${2:-}";    shift 2 ;;
    -h|--help)
      sed -n '2,17p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

fail() {
  echo "" >&2
  echo "  ERROR: $*" >&2
  echo "" >&2
  exit 1
}

ROOT="$(cd "$ROOT" && pwd)"
OUT_DIR="$ROOT/dist"

ENGINE_DIR="$ROOT/engine"
PROFILE_DIR="$ROOT/profile"
DIST_DIR="$ROOT/distribution"
LAUNCH_DIR="$ROOT/launch"
ICONS_DIR="$ROOT/icons"
LICENSE_FILE="$ROOT/LICENSE"
README_FILE="$ROOT/README.md"

# ---- Validate the source tree ----------------------------------------------
[ -d "$ENGINE_DIR" ]  || fail "Missing required folder 'engine' at '$ENGINE_DIR'."
[ -d "$PROFILE_DIR" ] || fail "Missing required folder 'profile' at '$PROFILE_DIR'."
[ -d "$DIST_DIR" ]    || fail "Missing required folder 'distribution' at '$DIST_DIR'."
[ -d "$LAUNCH_DIR" ]  || fail "Missing required folder 'launch' at '$LAUNCH_DIR'."
[ -d "$ICONS_DIR" ]   || fail "Missing required folder 'icons' at '$ICONS_DIR'."
[ -f "$LICENSE_FILE" ] || fail "Missing LICENSE at '$LICENSE_FILE'."
[ -f "$README_FILE" ]  || fail "Missing README.md at '$README_FILE'."

# ---- Resolve the version ----------------------------------------------------
if [ -z "$VERSION" ] && [ -f "$ENGINE_DIR/VERSION.txt" ]; then
  VERSION="$(grep -iE '^[[:space:]]*version[[:space:]]*[:=]' "$ENGINE_DIR/VERSION.txt" | head -n1 \
    | sed -E 's/.*[:=][[:space:]]*v?([0-9][0-9A-Za-z._-]*).*/\1/')"
  [ -n "$VERSION" ] || VERSION="$(grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' "$ENGINE_DIR/VERSION.txt" | head -n1)"
  [ -n "$VERSION" ] || VERSION="$(head -n1 "$ENGINE_DIR/VERSION.txt" | tr -d '[:space:]')"
fi
[ -n "$VERSION" ] || VERSION="0.1.0"

# ---- Locate the browser executable (fail loudly if absent) ------------------
ENGINE_EXE=""
for candidate in "$ENGINE_DIR/amnesialight" "$ENGINE_DIR/firefox"; do
  if [ -f "$candidate" ] && [ -x "$candidate" ]; then ENGINE_EXE="$candidate"; break; fi
done
if [ -z "$ENGINE_EXE" ]; then
  fail "No browser executable found in '$ENGINE_DIR'.
         Expected an executable 'amnesialight' (or 'firefox') in the engine folder.
         Drop the engine build into '$ENGINE_DIR' and run this script again."
fi

echo ""
echo "  AmnesiaLight portable packager"
echo "  root    : $ROOT"
echo "  version : $VERSION"
echo "  engine  : $ENGINE_EXE"
echo ""

# ---- Stage the package ------------------------------------------------------
APP_NAME="AmnesiaLight-$VERSION-portable-linux-x64"
WORK_DIR="$(mktemp -d)"
APP_DIR="$WORK_DIR/$APP_NAME"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT
mkdir -p "$APP_DIR"

cp -a "$ENGINE_DIR"  "$APP_DIR/engine"
cp -a "$PROFILE_DIR" "$APP_DIR/profile"
cp -a "$DIST_DIR"    "$APP_DIR/distribution"
cp -a "$LAUNCH_DIR"  "$APP_DIR/launch"
cp -a "$ICONS_DIR"   "$APP_DIR/icons"
cp -a "$LICENSE_FILE" "$APP_DIR/LICENSE"
cp -a "$README_FILE"  "$APP_DIR/README.md"
printf '%s\n' "$VERSION" > "$APP_DIR/VERSION.txt"

# ---- Top-level launchers ----------------------------------------------------
cat > "$APP_DIR/AmnesiaLight.sh" <<'LAUNCH'
#!/usr/bin/env bash
# AmnesiaLight portable launcher (private window, no traces).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE=""
for c in "$ROOT/engine/amnesialight" "$ROOT/engine/firefox"; do
  [ -x "$c" ] && ENGINE="$c" && break
done
if [ -z "$ENGINE" ]; then
  echo "AmnesiaLight - engine not found in $ROOT/engine" >&2
  exit 1
fi
echo "  AmnesiaLight  -  profile : $ROOT/profile"
echo "  Mode : private window (no traces)."
exec "$ENGINE" -profile "$ROOT/profile" -no-remote --private-window "$@"
LAUNCH
chmod +x "$APP_DIR/AmnesiaLight.sh"

cat > "$APP_DIR/Run AmnesiaLight (session).sh" <<'LAUNCH'
#!/usr/bin/env bash
# AmnesiaLight portable launcher (persistent session).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE=""
for c in "$ROOT/engine/amnesialight" "$ROOT/engine/firefox"; do
  [ -x "$c" ] && ENGINE="$c" && break
done
if [ -z "$ENGINE" ]; then
  echo "AmnesiaLight - engine not found in $ROOT/engine" >&2
  exit 1
fi
echo "  AmnesiaLight  -  profile : $ROOT/profile"
echo "  Mode : persistent session."
exec "$ENGINE" -profile "$ROOT/profile" -no-remote "$@"
LAUNCH
chmod +x "$APP_DIR/Run AmnesiaLight (session).sh"

# ---- Archive ----------------------------------------------------------------
mkdir -p "$OUT_DIR"
ARCHIVE="$OUT_DIR/$APP_NAME.tar.gz"
rm -f "$ARCHIVE"
tar -czf "$ARCHIVE" -C "$WORK_DIR" "$APP_NAME"

echo "  Built   : $ARCHIVE"
echo "  Size    : $(du -h "$ARCHIVE" | cut -f1)"
echo ""
