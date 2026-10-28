# sanstudio v3, Design Chain

One entry point, five gates, a stop at every gate. A design request plus evidence goes in; research, a locked visual contract, meaningfully different directions, a hi-fi mockup and, on the major lane, a production package come out.

## Skills

```text
skills/
├── design-chain/              # Entry point. Picks the lane, runs the gates, stops for the user
│   ├── SKILL.md
│   ├── references/lanes.md    # fast / standard / major
│   ├── references/control.md  # APPROVE / ITERATE / BACK / REVIEW / STOP
│   ├── references/modes.md    # visitor mode, invention scope, the rut, candidate spread, direction contract
│   ├── references/refine.md   # ITERATE verbs: polish, bolder, quieter, distill, harden, ...
│   ├── references/contracts.md # .sanstudio/ project contract folder
│   └── assets/                # TASTE.template.md, PRODUCT.template.md
├── research-synthesis/        # Gate 0: why, evidence, gaps. Runs on every lane
├── context-lock/              # Gate 1: who, what, visual contract, session DESIGN.md
├── direction-lock/            # Gate 2: three directions tied to findings
├── design-lock/               # Gate 3: hi-fi HTML, lint, QA, Figma export
│   ├── design-md-spec.md
│   ├── design-techniques-db.md
│   ├── figma-schema-v0.2.md
│   ├── mobile-app-patterns.md
│   ├── svg-patterns.md
│   └── references/
│       ├── craft-rules.md     # Binding, brand-independent rules with ids (UI-PILL-001, UI-STROKE-001, ...)
│       ├── review.md          # Fresh-eyes review: captures, independent reviewer, heuristics, personas, P0-P3
│       ├── INDEX.md           # Curated reference library lookup
│       └── mobile-app-examples/
└── production-lock/           # Gate 4: state matrix, component spec, handoff, readiness scorecard
```

Repo-only, not shipped: `TASTE.md` (Sander's taste), `design-systems/` (73 imported DESIGN.md files, Apache 2.0 and MIT, see `design-systems/NOTICE.md`), `figma-plugin/` (optional local bridge), `apps/`, `scripts/`, `private/` (gitignored team guides for private brands; never commit).

Never put a private brand's name, tokens or contract into a tracked file. Brand contracts live in their private pack repositories and reach a session through a product repository's `.sanstudio/` folder.

## Routing

Any design request routes to `design-chain`. Do not answer design questions directly and do not invoke a single gate unless the user names it.

Triggers: "design", "redesign", "mockup", "landing page", "幫我設計", "設計一個", "改一下這個 UI", a UI screenshot, a Figma link, a reference URL, or a request to critique or compare designs.

```text
request + evidence
    │
    ▼
design-chain  ── picks lane ──►  fast      G0 light → G1 → G3
                                 standard  G0 → G1 → G2 → G3
                                 major     G0 → G1 → G2 → G3 → G4
```

After every gate the chain prints the handoff block and waits for `APPROVE`, `ITERATE <note>`, `BACK G<n>` or `STOP`. Nothing else advances it.

### Skill loading rule

Read only the current gate's SKILL.md when entering it. Gate 3 also reads `design-md-spec.md`, `craft-rules.md`, `INDEX.md` and the matched reference `.md` files, plus the session `DESIGN.md` and the user's `TASTE.md`. Do not pre-read downstream gates. The previous gate's output is already in the conversation.

## Two overlays on every session

- `skills/design-lock/references/craft-rules.md` binds for every brand. Rules have ids so QA and the decision record can cite them. An exception needs the user's words and a line in `docs/decisions.md`.
- `TASTE.md` in the working directory is the user's. In this repo it is Sander's. Buyers get `skills/design-chain/assets/TASTE.template.md` and copy it to their project. Session `DESIGN.md` overrides taste tokens; craft rules override both.

## Output

Artifacts never go into `skills/`. Output root is `$SANSTUDIO_OUTPUT`, else `./sanstudio-output/`:

```text
<output-root>/
  latest -> sessions/<timestamp>-<slug>
  sessions/<timestamp>-<slug>/
    DESIGN.md
    research/report.md
    html/            # G3 mockups, html/directions/ for G2 wireframes
    figma/design-export.json
    docs/            # decisions.md, G4 package
```

Every visual artifact is an HTML file on disk, never inline. Images are mandatory in hi-fi; CSS-only is the recorded fallback.

## Figma

When a Figma MCP is connected, Gate 3 pushes directly. Otherwise it writes `figma/design-export.json` (schema in `skills/design-lock/figma-schema-v0.2.md`) and makes no network call. The local bridge in `figma-plugin/` is maintainer tooling: `node figma-plugin/server.js`, then Figma plugin, Auto-import, Start listening. The skills never assume it is running.

## Handoff blocks

`---RESEARCH-LOCK---`, `---CONTEXT-LOCK---` (and `-EVALUATED-`), `---DIRECTION-LOCK---`, `---DESIGN-LOCK---`, `---PRODUCTION-LOCK---`, each with a `-PARTIAL-` form on STOP.

## Retreat

`BACK G<n>` from any gate. Downstream artifacts are marked stale in `docs/decisions.md`. Lanes upgrade after G0 or G1 only, never downgrade silently.

## Packaging for Agensi

`./scripts/package-agensi.sh` builds `dist/sanstudio-pack-v<version>.zip`, one skill pack sold as one listing, from an allowlist plus `packaging/agensi/` (pack README, NOTICE, listing draft). It fails on private identifiers, local paths, scripts or binaries, images, symlinks, Agensi's security-scan patterns, unresolved cross references, frontmatter problems and the delivery limits (200 non-SKILL files, 6,000,000 characters). Run it before every listing update.

## Working rules

- No em or en dashes in user-facing copy. No trailing punctuation in titles.
- Match the user's language. Design terms stay in English.
- Reference library: drop screenshots into `mobile-app-examples/<industry>/`, annotate with `_template.md`, update `INDEX.md`. Screenshots stay out of the package; annotations ship.
