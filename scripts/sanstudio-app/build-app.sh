#!/usr/bin/env bash
# Build a Sanstudio.app bundle that wraps the Vite dev server.
#
# Usage:
#   ./scripts/sanstudio-app/build-app.sh [DEST_DIR]
#
# DEST_DIR defaults to /Applications. The script writes Sanstudio.app to that
# location, hardcoding the absolute path of THIS sanstudio repo into the
# launcher. Re-run after moving the repo or to pick up launcher.sh changes.
#
# What it builds:
#
#   Sanstudio.app/
#   ├── Contents/
#   │   ├── Info.plist
#   │   ├── MacOS/
#   │   │   └── sanstudio        <-- launcher.sh with REPO_PATH baked in
#   │   └── Resources/
#   │       └── AppIcon.icns     <-- optional; placeholder if missing
#
# After building, double-click the app in Finder OR drag it to your Dock.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEST_DIR="${1:-/Applications}"
APP_NAME="Sanstudio.app"
APP_PATH="$DEST_DIR/$APP_NAME"

# --- preflight ---------------------------------------------------------------

if [[ ! -d "$REPO_DIR/apps/shell" ]]; then
  echo "ERROR: apps/shell missing under $REPO_DIR" >&2
  echo "       This script must live at <repo>/scripts/sanstudio-app/build-app.sh" >&2
  exit 1
fi

if [[ ! -d "$DEST_DIR" ]]; then
  echo "ERROR: destination does not exist: $DEST_DIR" >&2
  exit 1
fi

if [[ ! -w "$DEST_DIR" ]]; then
  echo "ERROR: destination not writable: $DEST_DIR" >&2
  echo "  retry with sudo, or pass an alternative DEST_DIR (e.g. ~/Applications)" >&2
  exit 1
fi

# --- build bundle skeleton ---------------------------------------------------

echo "→ Building $APP_PATH"
echo "  repo = $REPO_DIR"

# Wipe any previous build so we don't leave stale files behind.
if [[ -d "$APP_PATH" ]]; then
  echo "  removing existing bundle"
  rm -rf "$APP_PATH"
fi

mkdir -p "$APP_PATH/Contents/MacOS"
mkdir -p "$APP_PATH/Contents/Resources"

# --- Info.plist --------------------------------------------------------------

cp "$SCRIPT_DIR/Info.plist.template" "$APP_PATH/Contents/Info.plist"

# --- launcher executable -----------------------------------------------------

# Substitute the placeholder with the actual repo path. Use a delimiter that
# can't appear in absolute paths.
sed "s|__SANSTUDIO_REPO_PLACEHOLDER__|$REPO_DIR|g" \
  "$SCRIPT_DIR/launcher.sh" > "$APP_PATH/Contents/MacOS/sanstudio"
chmod +x "$APP_PATH/Contents/MacOS/sanstudio"

# --- icon (optional) ---------------------------------------------------------

if [[ -f "$SCRIPT_DIR/AppIcon.icns" ]]; then
  cp "$SCRIPT_DIR/AppIcon.icns" "$APP_PATH/Contents/Resources/AppIcon.icns"
  echo "  icon: AppIcon.icns installed"
else
  echo "  icon: not provided (skip — Finder will show generic app icon)"
  echo "        drop AppIcon.icns into $SCRIPT_DIR and rebuild to add one."
fi

# --- finalize ----------------------------------------------------------------

# Bust the LaunchServices icon cache so Finder picks up the new bundle.
touch "$APP_PATH"

echo ""
echo "✓ Built $APP_PATH"
echo ""
echo "Next steps:"
echo "  1. Open Finder → $DEST_DIR — double-click Sanstudio to launch"
echo "  2. Drag the icon to your Dock for one-click access"
echo "  3. First launch may show 'unidentified developer' — right-click → Open"
echo ""
echo "Logs: ~/Library/Logs/Sanstudio/{vite,launcher}.log"
echo ""
echo "Re-run this script after editing launcher.sh OR moving the repo."
