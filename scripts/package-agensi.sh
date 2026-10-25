#!/usr/bin/env bash
# Build the Agensi distribution of sanstudio into dist/.
#
#   ./scripts/package-agensi.sh            # bundle + one zip per skill
#   ./scripts/package-agensi.sh --check    # scan only, build nothing
#
# Allowlist, not blocklist: only skills/<name>/ trees ship, minus screenshots
# and backups. Repo-only files (TASTE.md, design-systems/, figma-plugin/,
# apps/, scripts/) never enter the package. The scan fails the build on any
# local path, localhost reference, maintainer identifier or em dash inside
# SKILL.md frontmatter.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(sed -n 's/^  version: //p' "$ROOT/skills/design-chain/SKILL.md" | head -1)"
SKILLS=(design-chain research-synthesis context-lock direction-lock design-lock production-lock)
DIST="$ROOT/dist"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
CHECK_ONLY=0
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1

fail() { echo "FAIL: $*" >&2; exit 1; }

# ---- stage -----------------------------------------------------------------
PKG="$STAGE/sanstudio"
mkdir -p "$PKG/skills"
for s in "${SKILLS[@]}"; do
  [[ -f "$ROOT/skills/$s/SKILL.md" ]] || fail "missing skills/$s/SKILL.md"
  rsync -a \
    --exclude '*.bak' --exclude '*.png' --exclude '*.jpg' --exclude '*.jpeg' \
    --exclude '*.webp' --exclude '.DS_Store' --exclude '* 2.*' --exclude '* 2' \
    "$ROOT/skills/$s/" "$PKG/skills/$s/"
done
cp "$ROOT/LICENSE" "$PKG/LICENSE"
cp "$ROOT/README.md" "$PKG/README.md"

# ---- scan ------------------------------------------------------------------
echo "scan: forbidden patterns"
FORBIDDEN='/Users/|localhost|127\.0\.0\.1|sanstudio-ai-output|gamegen|xtraspots|royroshen|sander@|style-manifesto'
if grep -rnEi "$FORBIDDEN" "$PKG" --include='*.md' --include='*.yml' --include='*.json' --include='*.yaml' | grep -v '^.*LICENSE' ; then
  fail "forbidden pattern in package (see above)"
fi

echo "scan: frontmatter"
for s in "${SKILLS[@]}"; do
  f="$PKG/skills/$s/SKILL.md"
  fm="$(awk 'NR==1 && $0!="---"{exit 1} NR>1 && /^---$/{exit} NR>1{print}' "$f")" || fail "$s: SKILL.md must start with frontmatter"
  name="$(printf '%s\n' "$fm" | sed -n 's/^name: *//p' | head -1)"
  [[ "$name" == "$s" ]] || fail "$s: frontmatter name '$name' must equal folder name"
  [[ "$name" =~ ^[a-z0-9-]+$ ]] || fail "$s: name must be lowercase letters, digits, hyphens"
  printf '%s\n' "$fm" | grep -q '^description: ' || fail "$s: description missing or multi-line (Agensi wants one to three sentences on one line)"
  if printf '%s\n' "$fm" | grep -q -- '—\|–'; then fail "$s: em or en dash in frontmatter"; fi
done

echo "scan: scripts"
if find "$PKG" -type f \( -name '*.sh' -o -name '*.mjs' -o -name '*.js' -o -name '*.py' -o -name '*.ts' \) | grep -q .; then
  fail "package must ship no executable scripts (network and security scan policy)"
fi

echo "scan: symlinks and junk"
find "$PKG" -type l | grep -q . && fail "symlink in package"
find "$PKG" -name '.DS_Store' | grep -q . && fail ".DS_Store in package"

echo "scan: reference library"
imgs=$(find "$PKG" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \) | wc -l | tr -d ' ')
[[ "$imgs" == "0" ]] || fail "third-party screenshots must not ship ($imgs found)"

echo "scan: cross references"
missing=0
while IFS= read -r ref; do
  [[ -e "$PKG/$ref" ]] || { echo "  unresolved: $ref"; missing=1; }
done < <(grep -rhoE 'skills/(design-chain|research-synthesis|context-lock|direction-lock|design-lock|production-lock)/[A-Za-z0-9_./-]+\.(md|json)' "$PKG/skills" | sort -u)
[[ $missing == 0 ]] || fail "a gate references a file that is not in the package"

echo "scan: em dashes outside frontmatter (advisory)"
dash_total=$(grep -rho '—' "$PKG" --include='*.md' | wc -l | tr -d ' ')
echo "  $dash_total em dashes remain in skill bodies (allowed in headings and structural separators; review before copy goes public)"

if [[ $CHECK_ONLY == 1 ]]; then echo "check passed"; exit 0; fi

# ---- build -----------------------------------------------------------------
rm -rf "$DIST"; mkdir -p "$DIST"
( cd "$STAGE" && zip -qr -X "$DIST/sanstudio-bundle-v$VERSION.zip" sanstudio )
for s in "${SKILLS[@]}"; do
  ( cd "$PKG/skills" && cp ../LICENSE "$s/LICENSE" && zip -qr -X "$DIST/sanstudio-$s-v$VERSION.zip" "$s" && rm "$s/LICENSE" )
done

echo
echo "built:"
ls -la "$DIST" | awk 'NR>1 && $NF!="." && $NF!=".." {printf "  %8s  %s\n", $5, $NF}'
echo
echo "bundle contents:"
unzip -l "$DIST/sanstudio-bundle-v$VERSION.zip" | awk 'NR>3 {print $4}' | grep -v '^$' | sed '$d' | sed '$d'
