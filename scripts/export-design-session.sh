#!/usr/bin/env bash

set -euo pipefail

OUTPUT_ROOT="${SANSTUDIO_AI_OUTPUT_DIR:-/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output}"
SESSION_NAME=""
FIGMA_JSON=""
INTERACTION_SPEC=""
DDR_DOC=""
HANDOFF_DOC=""
PUSH_TO_FIGMA=0
HTML_FILES=()

usage() {
  cat <<'EOF'
Usage:
  ./scripts/export-design-session.sh \
    --session "checkout-v1" \
    --html path/to/mockup.html \
    --json path/to/design-export.json \
    [--interaction-spec path/to/design-interaction-spec.md] \
    [--ddr path/to/design-ddr.md] \
    [--handoff path/to/design-handoff.md] \
    [--push]

What it does:
  1. Creates a timestamped session directory outside the repo
  2. Copies HTML, Figma JSON, and companion docs into that session
  3. Updates the "latest" symlink for quick access
  4. Optionally pushes the JSON to the local Figma bridge server
EOF
}

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

escape_json() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

copy_into() {
  local src="$1"
  local dest="$2"

  if [[ ! -f "$src" ]]; then
    printf 'Missing file: %s\n' "$src" >&2
    exit 1
  fi

  cp "$src" "$dest"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --session)
      SESSION_NAME="${2:-}"
      shift 2
      ;;
    --html)
      HTML_FILES+=("${2:-}")
      shift 2
      ;;
    --json)
      FIGMA_JSON="${2:-}"
      shift 2
      ;;
    --interaction-spec)
      INTERACTION_SPEC="${2:-}"
      shift 2
      ;;
    --ddr)
      DDR_DOC="${2:-}"
      shift 2
      ;;
    --handoff)
      HANDOFF_DOC="${2:-}"
      shift 2
      ;;
    --output-root)
      OUTPUT_ROOT="${2:-}"
      shift 2
      ;;
    --push)
      PUSH_TO_FIGMA=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n\n' "$1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$SESSION_NAME" ]]; then
  printf 'Missing required argument: --session\n\n' >&2
  usage >&2
  exit 1
fi

if [[ -z "$FIGMA_JSON" ]]; then
  printf 'Missing required argument: --json\n\n' >&2
  usage >&2
  exit 1
fi

SESSION_SLUG="$(slugify "$SESSION_NAME")"
if [[ -z "$SESSION_SLUG" ]]; then
  SESSION_SLUG="session"
fi

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
SESSION_DIR="$OUTPUT_ROOT/sessions/${TIMESTAMP}-${SESSION_SLUG}"
LATEST_LINK="$OUTPUT_ROOT/latest"

mkdir -p "$SESSION_DIR/html" "$SESSION_DIR/figma" "$SESSION_DIR/docs"

HTML_BASENAMES=()
for html_file in "${HTML_FILES[@]}"; do
  html_name="$(basename "$html_file")"
  copy_into "$html_file" "$SESSION_DIR/html/$html_name"
  HTML_BASENAMES+=("$html_name")
done

copy_into "$FIGMA_JSON" "$SESSION_DIR/figma/design-export.json"

if [[ -n "$INTERACTION_SPEC" ]]; then
  copy_into "$INTERACTION_SPEC" "$SESSION_DIR/docs/design-interaction-spec.md"
fi

if [[ -n "$DDR_DOC" ]]; then
  copy_into "$DDR_DOC" "$SESSION_DIR/docs/design-ddr.md"
fi

if [[ -n "$HANDOFF_DOC" ]]; then
  copy_into "$HANDOFF_DOC" "$SESSION_DIR/docs/design-handoff.md"
fi

HTML_JSON="[]"
if [[ ${#HTML_BASENAMES[@]} -gt 0 ]]; then
  HTML_JSON="["
  for name in "${HTML_BASENAMES[@]}"; do
    escaped_name="$(escape_json "$name")"
    HTML_JSON="${HTML_JSON}\"html/${escaped_name}\","
  done
  HTML_JSON="${HTML_JSON%,}]"
fi

SESSION_NAME_ESCAPED="$(escape_json "$SESSION_NAME")"
OUTPUT_ROOT_ESCAPED="$(escape_json "$OUTPUT_ROOT")"
SESSION_DIR_ESCAPED="$(escape_json "$SESSION_DIR")"

cat > "$SESSION_DIR/session.json" <<EOF
{
  "session_name": "$SESSION_NAME_ESCAPED",
  "created_at": "$(date '+%Y-%m-%dT%H:%M:%S%z')",
  "output_root": "$OUTPUT_ROOT_ESCAPED",
  "session_dir": "$SESSION_DIR_ESCAPED",
  "paths": {
    "html": $HTML_JSON,
    "figma_json": "figma/design-export.json",
    "interaction_spec": $( [[ -n "$INTERACTION_SPEC" ]] && printf '"docs/design-interaction-spec.md"' || printf 'null' ),
    "design_ddr": $( [[ -n "$DDR_DOC" ]] && printf '"docs/design-ddr.md"' || printf 'null' ),
    "handoff": $( [[ -n "$HANDOFF_DOC" ]] && printf '"docs/design-handoff.md"' || printf 'null' )
  }
}
EOF

ln -sfn "$SESSION_DIR" "$LATEST_LINK"

if [[ "$PUSH_TO_FIGMA" -eq 1 ]]; then
  printf 'Pushing %s to Figma bridge...\n' "$SESSION_DIR/figma/design-export.json"
  curl -sS -X POST http://localhost:3333/push \
    -H "Content-Type: application/json" \
    -d @"$SESSION_DIR/figma/design-export.json"
  printf '\n'
fi

printf 'Exported session: %s\n' "$SESSION_DIR"
printf 'Latest shortcut: %s\n' "$LATEST_LINK"
