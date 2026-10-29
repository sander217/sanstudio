#!/usr/bin/env python3
# Verbatim-overlap check before an Agensi listing update. Usage:
#   ./scripts/package-agensi.sh && unzip -q dist/sanstudio-pack-v*.zip -d /tmp/pack
#   python3 scripts/check-overlap.py /tmp/pack imp=<impeccable skill dir> hal=<hallmark skill dir> taste=<taste-skill dir>
# Prints every run of 9+ identical words shared with a source. Rewrite prose runs;
# CSS idioms, format token names and public heuristic names are fine.
import sys, re, pathlib, collections
pkg = pathlib.Path(sys.argv[1]); srcs = {n: pathlib.Path(p) for n, p in (a.split("=") for a in sys.argv[2:])}
N = 9
def words(t): return re.findall(r"[a-z0-9']+", t.lower())
def shingles(ws): return {" ".join(ws[i:i+N]) for i in range(len(ws)-N+1)}
src_sh = {}
for name, root in srcs.items():
    sh = collections.defaultdict(set)
    for f in root.rglob("*"):
        if f.suffix.lower() in {".md", ".txt", ".yml", ".yaml", ".json"} and ".git" not in f.parts and f.stat().st_size < 2_000_000:
            for s in shingles(words(f.read_text(errors="ignore"))): sh[s].add(str(f.relative_to(root)))
    src_sh[name] = sh
for f in sorted(pkg.rglob("*.md")):
    ws = words(f.read_text(errors="ignore")); mine = [" ".join(ws[i:i+N]) for i in range(len(ws)-N+1)]
    for name, sh in src_sh.items():
        hits = [i for i, s in enumerate(mine) if s in sh]
        if not hits: continue
        # merge consecutive hits into runs
        runs = []; start = prev = hits[0]
        for i in hits[1:]:
            if i == prev + 1: prev = i; continue
            runs.append((start, prev)); start = prev = i
        runs.append((start, prev))
        total = sum(b - a + N for a, b in runs)
        print(f"{f.relative_to(pkg)}  <-  {name}: {len(runs)} runs, ~{total} words copied of {len(ws)}")
        for a, b in runs:
            print("     >", " ".join(ws[a:b+N])[:220])
