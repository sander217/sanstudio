# design-systems/ Attribution

The design system files in this directory (each `<name>/DESIGN.md`) are imported from:

- **Source repo**: [nexu-io/open-design](https://github.com/nexu-io/open-design) — `design-systems/`
- **License**: Apache License 2.0
- **Upstream sync source**: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) — `design-md/`
- **Upstream license**: MIT

These are community-curated design system descriptions of public products (Stripe, Spotify, Tesla, etc.). Each DESIGN.md is observational analysis — not affiliated with or endorsed by the respective brands. Trademarks belong to their owners.

## Local-only modifications
- `default/` and `warm-editorial/` are hand-authored starters from open-design (kept as-is).
- Any future sanstudio-original systems live under `design-systems/<name>/` alongside imported ones.

## Re-syncing
To pull updates from upstream:
```
git clone --depth 1 https://github.com/nexu-io/open-design.git /tmp/open-design
rsync -a --delete /tmp/open-design/design-systems/ ./design-systems/
# then restore this NOTICE.md
```
