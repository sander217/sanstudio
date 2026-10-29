#!/usr/bin/env bash
# Sanstudio.app launcher — runs inside the .app bundle's MacOS/ directory.
#
# Lifecycle:
#   1. Resolve the sanstudio repo path (configured at build time via REPO_PATH)
#   2. Spawn `npm run dev` in apps/shell (background, logged to /tmp)
#   3. Poll http://localhost:5180 until it serves a 200
#   4. Open the user's default browser to the shell URL
#   5. Trap exit → kill the dev server so quitting the app cleans up
#
# Logs land at ~/Library/Logs/Sanstudio/{vite.log,launcher.log}. View with:
#   tail -f ~/Library/Logs/Sanstudio/vite.log
#
# Configuration is read from these env vars (set by Info.plist or before launch):
#   SANSTUDIO_REPO  — absolute path to the sanstudio repo (required)
#   SANSTUDIO_PORT  — port the shell listens on (default 5180)
#   SANSTUDIO_OPEN  — set to 0 to skip the browser-open step

set -uo pipefail

# --- config ------------------------------------------------------------------

REPO="${SANSTUDIO_REPO:-__SANSTUDIO_REPO_PLACEHOLDER__}"
PORT="${SANSTUDIO_PORT:-5180}"
OPEN_BROWSER="${SANSTUDIO_OPEN:-1}"

LOG_DIR="$HOME/Library/Logs/Sanstudio"
LAUNCHER_LOG="$LOG_DIR/launcher.log"
VITE_LOG="$LOG_DIR/vite.log"

mkdir -p "$LOG_DIR"
exec >>"$LAUNCHER_LOG" 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# --- preflight ---------------------------------------------------------------

if [[ ! -d "$REPO" ]]; then
  log "FATAL: sanstudio repo not found at: $REPO"
  osascript -e "display alert \"Sanstudio\" message \"Repo not found at:\\n$REPO\\n\\nReinstall by running scripts/sanstudio-app/build-app.sh from a working sanstudio checkout.\" as critical" 2>/dev/null
  exit 1
fi

SHELL_DIR="$REPO/apps/shell"
if [[ ! -d "$SHELL_DIR" ]]; then
  log "FATAL: apps/shell missing under $REPO"
  osascript -e "display alert \"Sanstudio\" message \"apps/shell not found under:\\n$REPO\" as critical" 2>/dev/null
  exit 1
fi

# Add Homebrew + nvm Node paths so launches from Finder (which has a sparse
# PATH) can still find `node`, `npm`, and `claude`.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)/bin:$PATH"

if ! command -v npm >/dev/null 2>&1; then
  log "FATAL: npm not found in PATH"
  osascript -e "display alert \"Sanstudio\" message \"npm not found.\\n\\nInstall Node.js from https://nodejs.org and try again.\" as critical" 2>/dev/null
  exit 1
fi

# --- start dev server --------------------------------------------------------

log "starting vite (repo=$REPO, port=$PORT)"
cd "$SHELL_DIR"

# Install deps on first launch / after upgrades. Cheap when up-to-date.
if [[ ! -d node_modules ]]; then
  log "node_modules missing — running npm install (may take a minute)"
  npm install >>"$VITE_LOG" 2>&1
fi

# Start vite in background; capture PID so we can clean up on exit.
npm run dev >>"$VITE_LOG" 2>&1 &
VITE_PID=$!
log "vite started with PID $VITE_PID"

cleanup() {
  log "shutting down (signal=${1:-EXIT})"
  if kill -0 "$VITE_PID" 2>/dev/null; then
    log "killing vite PID $VITE_PID"
    kill "$VITE_PID" 2>/dev/null
    # Give it 2s to exit gracefully, then SIGKILL.
    for _ in 1 2 3 4; do
      sleep 0.5
      if ! kill -0 "$VITE_PID" 2>/dev/null; then break; fi
    done
    if kill -0 "$VITE_PID" 2>/dev/null; then
      log "vite still alive — SIGKILL"
      kill -9 "$VITE_PID" 2>/dev/null
    fi
  fi
}
trap 'cleanup EXIT' EXIT
trap 'cleanup INT; exit 130' INT
trap 'cleanup TERM; exit 143' TERM

# --- wait for server ready ---------------------------------------------------

URL="http://localhost:$PORT/"
log "waiting for $URL (max 60s)"
for i in $(seq 1 120); do
  if curl -fsS --max-time 1 "$URL" >/dev/null 2>&1; then
    log "server up after ${i} half-seconds"
    break
  fi
  if ! kill -0 "$VITE_PID" 2>/dev/null; then
    log "FATAL: vite died before server came up — check $VITE_LOG"
    osascript -e "display alert \"Sanstudio\" message \"Dev server failed to start.\\n\\nCheck logs:\\n$VITE_LOG\" as critical" 2>/dev/null
    exit 1
  fi
  sleep 0.5
done

# --- open browser ------------------------------------------------------------

if [[ "$OPEN_BROWSER" == "1" ]]; then
  log "opening browser to $URL"
  open "$URL"
fi

# --- block until vite exits or we're killed ----------------------------------

log "running — pid=$$, vite pid=$VITE_PID"
wait "$VITE_PID"
EXIT_CODE=$?
log "vite exited with code $EXIT_CODE"
exit "$EXIT_CODE"
