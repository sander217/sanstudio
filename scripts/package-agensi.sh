#!/usr/bin/env bash
# Build the Agensi distribution of sanstudio into dist/.
#
#   ./scripts/package-agensi.sh             # one skill pack ZIP (one listing)
#   ./scripts/package-agensi.sh --check     # scan only, build nothing
#   ./scripts/package-agensi.sh --singles   # also one ZIP per skill (see note)
#
# Agensi rules this script enforces (https://www.agensi.io/docs/packaging and
# /docs/review-and-approval, read 2026-10-28):
#   - one ZIP; every SKILL.md inside becomes part of one skill pack listing;
#     the README's first heading becomes the pack name
#   - name lowercase-hyphen and equal to its folder; one-line description
#   - text only: no executables, no bundled dependencies, no symlinks
#   - what reaches the buyer's agent: every SKILL.md plus up to 200 other text
#     files, within 6,000,000 characters
#   - the 8-point scan: no dangerous commands, secrets, env harvesting, network
#     access, obfuscation or prompt-injection phrases
#
# Allowlist, not blocklist: only skills/<name>/ trees plus packaging/agensi/
# ship. Repo-only files (TASTE.md, design-systems/, figma-plugin/, apps/,
# scripts/, private/) never enter the package.
#
# --singles note: the gates reference each other by skills/<name>/ paths, so a
# single skill sold alone loses its cross references. Sell the pack.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(sed -n 's/^  version: //p' "$ROOT/skills/design-chain/SKILL.md" | head -1)"
SKILLS=(design-chain research-synthesis context-lock direction-lock design-lock production-lock)
DIST="$ROOT/dist"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
CHECK_ONLY=0; SINGLES=0
for a in "$@"; do
  case "$a" in
    --check) CHECK_ONLY=1 ;;
    --singles) SINGLES=1 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "  WARN: $*"; }

# ---- stage -----------------------------------------------------------------
PKG="$STAGE/sanstudio"
mkdir -p "$PKG/skills"
for s in "${SKILLS[@]}"; do
  [[ -f "$ROOT/skills/$s/SKILL.md" ]] || fail "missing skills/$s/SKILL.md"
  rsync -a \
    --exclude '*.bak' --exclude '*.png' --exclude '*.jpg' --exclude '*.jpeg' \
    --exclude '*.webp' --exclude '*.gif' --exclude '*.pdf' --exclude '.DS_Store' \
    --exclude '* 2.*' --exclude '* 2' \
    "$ROOT/skills/$s/" "$PKG/skills/$s/"
done
cp "$ROOT/packaging/agensi/README.md" "$PKG/README.md"
cp "$ROOT/packaging/agensi/NOTICE.md" "$PKG/NOTICE.md"
mkdir -p "$PKG/licenses" && cp "$ROOT/packaging/agensi/licenses/"*.txt "$PKG/licenses/"

# ---- scan ------------------------------------------------------------------
echo "scan: git file modes"
# A file stored as a symlink (mode 120000) checks out as a plain file on a
# machine with core.symlinks=false, so the bug hides on macOS, then breaks
# Linux clones with "File name too long". Every tracked file must be regular.
if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  links=$(git -C "$ROOT" ls-files -s | awk '$1==120000 {print $4}')
  [[ -z "$links" ]] || { echo "$links" | sed 's/^/  symlink entry: /'; fail "tracked symlink entries; fix with: git rm --cached <file> && git add <file>"; }
fi

echo "scan: private identifiers and local paths"
FORBIDDEN='/Users/|localhost|127\.0\.0\.1|sanstudio-ai-output|gamegen|xtraspots|xtraplug|northstar|royroshen|sander@|style-manifesto'
if grep -rnEi "$FORBIDDEN" "$PKG" ; then
  fail "forbidden pattern in package (see above)"
fi

echo "scan: frontmatter"
for s in "${SKILLS[@]}"; do
  f="$PKG/skills/$s/SKILL.md"
  fm="$(awk 'NR==1 && $0!="---"{exit 1} NR>1 && /^---$/{exit} NR>1{print}' "$f")" || fail "$s: SKILL.md must start with frontmatter"
  name="$(printf '%s\n' "$fm" | sed -n 's/^name: *//p' | head -1)"
  [[ "$name" == "$s" ]] || fail "$s: frontmatter name '$name' must equal folder name"
  [[ "$name" =~ ^[a-z0-9-]+$ ]] || fail "$s: name must be lowercase letters, digits, hyphens"
  printf '%s\n' "$fm" | grep -q '^description: ' || fail "$s: description missing or multi-line"
  sentences=$(printf '%s\n' "$fm" | sed -n 's/^description: //p' | grep -oE '[.!?]( |$)' | wc -l | tr -d ' ')
  (( sentences <= 3 )) || warn "$s: description has $sentences sentences; Agensi asks for one to three"
  if printf '%s\n' "$fm" | grep -q -- '—\|–'; then fail "$s: em or en dash in frontmatter"; fi
done

echo "scan: file types"
if find "$PKG" -type f \( -name '*.sh' -o -name '*.mjs' -o -name '*.js' -o -name '*.py' -o -name '*.ts' \
     -o -name '*.exe' -o -name '*.dll' -o -name '*.so' -o -name '*.dylib' -o -name '*.bin' -o -name '*.wasm' \
     -o -name '*.jar' -o -name '*.class' \) | grep -q .; then
  fail "package must ship text only: no scripts or executables"
fi
find "$PKG" -type d \( -name node_modules -o -name site-packages -o -name .venv -o -name __pycache__ -o -name .git \) | grep -q . && fail "bundled dependencies or VCS folders in package"
find "$PKG" -type l | grep -q . && fail "symlink in package"
find "$PKG" -name '.DS_Store' | grep -q . && fail ".DS_Store in package"
imgs=$(find "$PKG" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.gif' -o -name '*.pdf' \) | wc -l | tr -d ' ')
[[ "$imgs" == "0" ]] || fail "images or PDFs in package ($imgs); agents cannot read them and third-party screenshots carry IP risk"

echo "scan: security checks (dangerous commands, secrets, env harvesting, injection)"
SEC='rm -rf /|curl[^|`]*\|[[:space:]]*(ba)?sh|wget[^|`]*\|[[:space:]]*(ba)?sh|os\.system|shell=True|chmod 777|sudo |eval\(|ignore (all )?(previous|prior) instructions|disregard (all |any )?(previous|prior)|you are now (a|an|in)|sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|(api[_-]?key|password|secret)[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"' ]{8,}'
if grep -rnEi "$SEC" "$PKG"; then
  fail "security scan pattern in package (see above)"
fi
w=$( { grep -rnEi 'base64|\bcurl\b|\bfetch\(|\bsudo\b' "$PKG" || true; } | wc -l | tr -d ' ')
[[ "$w" == "0" ]] || warn "$w lines mention base64, curl, fetch or sudo; Agensi scores each as a warning"

echo "scan: third-party licences"
for lic in APACHE-2.0.txt MIT-hallmark.txt MIT-taste-skill.txt; do [[ -f "$PKG/licenses/$lic" ]] || fail "missing licenses/$lic (required by an adapted source)"; done
grep -q "impeccable" "$PKG/NOTICE.md" && grep -q "taste-skill" "$PKG/NOTICE.md" && grep -q "hallmark" "$PKG/NOTICE.md" && grep -q "design.md" "$PKG/NOTICE.md" || fail "NOTICE.md must credit every adapted source"

echo "scan: cross references"
missing=0
while IFS= read -r ref; do
  [[ -e "$PKG/$ref" ]] || { echo "  unresolved: $ref"; missing=1; }
done < <(grep -rhoE 'skills/(design-chain|research-synthesis|context-lock|direction-lock|design-lock|production-lock)/[A-Za-z0-9_./-]+\.(md|json)' "$PKG/skills" | sort -u)
[[ $missing == 0 ]] || fail "a gate references a file that is not in the package"

echo "scan: delivery limits"
n_skill=$(find "$PKG" -name SKILL.md | wc -l | tr -d ' ')
n_other=$(find "$PKG" -type f ! -name SKILL.md | wc -l | tr -d ' ')
n_chars=$(find "$PKG" -type f -exec cat {} + | wc -m | tr -d ' ')
n_files=$(find "$PKG" -type f | wc -l | tr -d ' ')
echo "  $n_skill SKILL.md, $n_other other files, $n_chars characters"
(( n_other <= 200 )) || fail "more than 200 non-SKILL.md files ($n_other); the excess never reaches the buyer's agent"
(( n_chars <= 6000000 )) || fail "over 6,000,000 characters ($n_chars)"
(( n_files <= 1000 )) || fail "over 1,000 files"
(( n_skill <= 50 )) || fail "over 50 skills in one pack"

echo "scan: listing fields"
L="$ROOT/packaging/agensi/listing.md"
lname=$(awk '/^## Name/{getline; getline; print; exit}' "$L")
lsum=$(awk '/^## Summary/{getline; getline; print; exit}' "$L")
pname=$(sed -n 's/^# //p' "$PKG/README.md" | head -1)
(( ${#lname} <= 60 )) || fail "listing name over 60 characters"
(( ${#pname} <= 60 )) || fail "pack name (README heading) over 60 characters"
(( ${#lsum} <= 300 )) || fail "listing summary over 300 characters (${#lsum})"
echo "  pack name: $pname (${#pname}); summary: ${#lsum} characters"

echo "scan: em dashes outside frontmatter (advisory)"
dash_total=$( { grep -rho '—' "$PKG" --include='*.md' || true; } | wc -l | tr -d ' ')
echo "  $dash_total em dashes remain in skill bodies (structural separators; review before copy goes public)"

if [[ $CHECK_ONLY == 1 ]]; then echo "check passed"; exit 0; fi

# ---- build -----------------------------------------------------------------
rm -rf "$DIST"; mkdir -p "$DIST"
( cd "$STAGE" && zip -qr -X "$DIST/sanstudio-pack-v$VERSION.zip" sanstudio )
size=$(wc -c < "$DIST/sanstudio-pack-v$VERSION.zip" | tr -d ' ')
(( size <= 50*1024*1024 )) || fail "pack ZIP over 50 MB"
if [[ $SINGLES == 1 ]]; then
  for s in "${SKILLS[@]}"; do
    ( cd "$PKG/skills" && cp ../NOTICE.md "$s/NOTICE.md" && zip -qr -X "$DIST/sanstudio-$s-v$VERSION.zip" "$s" && rm "$s/NOTICE.md" )
  done
fi

echo
echo "built:"
ls -la "$DIST" | awk 'NR>1 && $NF!="." && $NF!=".." {printf "  %8s  %s\n", $5, $NF}'
echo
echo "upload dist/sanstudio-pack-v$VERSION.zip as one listing; copy fields from packaging/agensi/listing.md"
