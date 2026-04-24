# DESIGN.md Format (adapted for sanstudio)

> Source: [google-labs-code/design.md](https://github.com/google-labs-code/design.md) — adapted for the 3-gate pipeline. Distilled essence, not the full spec.

DESIGN.md is the **shared visual-system language** between Gate 1, Gate 2, Gate 3.
Gate 1 emits one. Gate 3 reads it. Style-manifesto is shaped like one.

A DESIGN.md is a single file with **two layers**:

1. **YAML frontmatter** — machine-readable design tokens (binding values)
2. **Markdown body** — human-readable rationale (the *why*)

```
---
<YAML tokens>
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
```

---

## YAML Token Schema

```yaml
version: alpha            # always "alpha" for now
name: <string>            # design system name (e.g. "Atmospheric Glass")
description: <string>     # optional one-liner

colors:
  <token-name>: "#hex"    # e.g. primary: "#1A1C1E"

typography:
  <token-name>:
    fontFamily: <string>
    fontSize: <Dimension>      # 48px, 1rem, etc
    fontWeight: <number>       # 400, 600, 700
    lineHeight: <Dimension|number>
    letterSpacing: <Dimension> # -0.02em
    fontFeature: <string>      # optional CSS font-feature-settings
    fontVariation: <string>    # optional CSS font-variation-settings

rounded:
  <scale>: <Dimension>    # sm: 4px, md: 8px, lg: 12px, full: 9999px

spacing:
  <scale>: <Dimension|number>  # xs: 4px, sm: 8px, md: 16px, gutter: 24px

components:
  <component-name>:
    backgroundColor: <Color | TokenRef>
    textColor: <Color | TokenRef>
    typography: <TokenRef>      # references full typography object
    rounded: <Dimension | TokenRef>
    padding: <Dimension>
    size | height | width: <Dimension>
```

### Token references

Wrap in `{}` — refer to any defined token by path:

```yaml
button-primary:
  backgroundColor: "{colors.primary}"
  textColor: "{colors.on-primary}"
  rounded: "{rounded.md}"
  typography: "{typography.label-sm}"
```

References must resolve. Broken refs = lint error.

### Component variants

Variants are separate components with related names — `button-primary`, `button-primary-hover`, `button-primary-active`, `button-primary-disabled`.

```yaml
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-primary-hover:
    backgroundColor: "{colors.primary-fixed-dim}"
```

### Recommended token names (not enforced — but use these unless you have a reason)

- **Colors**: `primary`, `secondary`, `tertiary`, `neutral`, `surface`, `on-surface`, `error`. For multi-tone systems (Material 3-style): `surface-container-low`, `surface-container`, `surface-container-high`, `on-surface-variant`, `outline`, `outline-variant`, `primary-fixed`, `primary-fixed-dim`, `on-primary`, `on-primary-container`.
- **Typography**: `display-lg`, `display-md`, `headline-lg`, `headline-md`, `headline-sm`, `body-lg`, `body-md`, `body-sm`, `label-lg`, `label-md`, `label-sm`.
- **Rounded**: `none`, `sm`, `md`, `lg`, `xl`, `full`.
- **Spacing**: `xs`, `sm`, `md`, `lg`, `xl`, plus semantic ones like `gutter`, `margin`, `container-padding`, `section-margin`.

---

## Section Structure (Markdown body)

Use `##` headings. Sections optional but if present must appear in this order:

| # | Section | Purpose |
|:--|:--------|:--------|
| 1 | Overview (or "Brand & Style") | Personality, target audience, emotional tone |
| 2 | Colors | Palette rationale + each color's role |
| 3 | Typography | Font choices, weights, why each level exists |
| 4 | Layout (or "Layout & Spacing") | Grid model, spacing scale, density |
| 5 | Elevation & Depth | How hierarchy is conveyed (shadows / tonal layers / borders) |
| 6 | Shapes | Corner radius, geometric language |
| 7 | Components | Per-component styling notes (atoms only — buttons, chips, lists, inputs) |
| 8 | Do's and Don'ts | Practical guardrails |

Duplicate headings = error. Out-of-order sections = warning.

---

## Lint Rules (run before exporting / showing to user)

| Rule | Severity | Check |
|:-----|:---------|:------|
| `broken-ref` | ❌ error | All `{path.to.token}` references resolve to defined tokens |
| `missing-primary` | ⚠️ warning | If colors defined, `primary` must exist |
| `contrast-ratio` | ⚠️ warning | Component `backgroundColor` × `textColor` pair has WCAG AA contrast ≥ 4.5:1 |
| `orphaned-tokens` | ⚠️ warning | All defined color tokens are referenced by ≥1 component |
| `missing-typography` | ⚠️ warning | If colors defined, ≥1 typography token exists |
| `section-order` | ⚠️ warning | Sections appear in canonical order |
| `duplicate-section` | ❌ error | No `##` heading appears twice |

Gate 3 must run these checks against the session DESIGN.md as part of QA. WCAG AA failures block export — accessibility is non-negotiable.

### WCAG AA contrast helper

For each component with both `backgroundColor` and `textColor`, compute relative luminance ratio. Must be ≥ 4.5:1 (normal text) or ≥ 3:1 (large text 18pt+/14pt bold+). Report failures with the offending pair + actual ratio.

---

## How sanstudio uses DESIGN.md

### Gate 1 (`/context-lock`)

When extracting visual contract from a reference URL/screenshot, also emit a 
session DESIGN.md at:

```
/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output/sessions/<timestamp>-<slug>/DESIGN.md
```

The DESIGN.md is the **canonical visual contract** — gates pass its path, 
not duplicated JSON.

### Gate 2 (`/direction-lock`)

Read the DESIGN.md. Validate that proposed directions don't violate 
`Do's and Don'ts` or require tokens that don't exist. Flag if a direction 
needs new tokens — propose adding them, don't silently invent.

### Gate 3 (`/design-lock`)

- Load the DESIGN.md before any HTML
- Use token names directly: `<button class="btn-primary" data-bg="{colors.primary}">`
- HTML inline styles use the resolved hex values (commenting the token name)
- Every Hi-Fi Fill Checklist run also runs DESIGN.md lint rules
- Failed `contrast-ratio` = block, fix, regenerate

### style-manifesto.md

The user's manifesto file in `references/` is structured as a partial DESIGN.md — Overview + Do's and Don'ts at minimum, optionally with `colors`/`typography` defaults that override Gate 1's defaults.

### Reference annotations

Each `references/mobile-app-examples/<industry>/<id>.md` extracts partial DESIGN.md 
tokens from the screenshot — colors, typography, components — so they can be 
merged into a session DESIGN.md as starting points.

---

## What we deliberately don't adopt

- **`@google/design.md` CLI**: too heavy a dependency. Lint rules are reimplemented inline in Gate 3's QA step.
- **`diff` command**: git already does this.
- **Tailwind / DTCG export**: out of scope for now. Add later if a project needs runtime token consumption.
- **`.agents/skills/` from the upstream repo**: those are SE skills (TDD, ink, etc.), not design skills. Irrelevant.
