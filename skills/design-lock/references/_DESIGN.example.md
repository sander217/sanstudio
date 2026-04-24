---
version: alpha
name: Quiet Ledger
description: A finance app for everyday personal accounting — calm, confident, data-forward.
colors:
  surface: "#0B0F1A"
  surface-container: "#141A2A"
  surface-container-high: "#1B2235"
  on-surface: "#E8ECF5"
  on-surface-variant: "#A0A8BD"
  outline: "#2A3247"
  primary: "#3DD68C"
  on-primary: "#03291A"
  primary-container: "#0F4A2E"
  on-primary-container: "#9CECC0"
  secondary: "#FF6B6B"
  on-secondary: "#3F0A0A"
  tertiary: "#7C9EFF"
  on-tertiary: "#0A1A45"
  error: "#FF6B6B"
  on-error: "#3F0A0A"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.03em
    fontFeature: '"tnum" 1'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.45
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.2
  amount-positive:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1
    fontFeature: '"tnum" 1, "ss01" 1'
  amount-negative:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1
    fontFeature: '"tnum" 1, "ss01" 1'
rounded:
  sm: 8px
  md: 14px
  lg: 20px
  xl: 28px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  screen-padding: 20px
components:
  balance-card:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.lg}"
    padding: 24px
  transaction-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    padding: 12px
    height: 64px
  category-pill:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 6px 12px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    height: 52px
    padding: 0 24px
  button-primary-pressed:
    backgroundColor: "{colors.primary-container}"
  button-ghost:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 16px
  tab-bar-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
  tab-bar-item-active:
    textColor: "{colors.primary}"
---

## Overview

**Quiet Ledger** is a personal finance app for someone who already trusts their own money decisions. The interface should feel like a well-made instrument — confident, dense with information, never anxious. Dark by default because users open it many times a day; eye fatigue matters more than wow factor.

Tone: instrument, not toy. Numbers dominate. Decoration is minimal but precise.

## Colors

Built on a near-black surface (`#0B0F1A`) with cool slate elevation. The single accent is **mint** (`#3DD68C`) for income and primary actions; **coral** (`#FF6B6B`) for expense/destructive. Tertiary blue (`#7C9EFF`) is reserved for informational links and savings categories.

- **Mint primary** earns its prominence — never use it for decoration. It's reserved for: positive amounts, primary CTAs, the active tab.
- **Coral** is similarly disciplined: negative amounts, destructive confirms, error states. Never as a section background.
- **Surface tonal layers** (`surface`, `surface-container`, `surface-container-high`) replace shadows. Elevation = darker→lighter, not shadow blur.

## Typography

Inter throughout — single family, fully variable. Numerals use **tabular figures** (`fontFeature: "tnum" 1`) so transaction lists align cleanly down the right edge. The `amount-positive` / `amount-negative` typography tokens additionally enable `ss01` for the slashed zero (helps distinguish from "O" in dense rows).

- **display-lg** is for the home screen balance only — one element per screen, never duplicated.
- **headline-md** for screen titles and section headers.
- **body-lg / body-md** for descriptive text. body-lg in detail screens, body-md in dense lists.
- **label-md** for everything button-like, tab labels, category pills.

## Layout

Single-column mobile-first. Screen padding is `screen-padding` (20px) on all sides except the balance card which is `lg` (24px) for breathing room. Lists run edge-to-edge with internal `padding: 12px`.

The `gutter` (16px) is the standard between adjacent siblings. Section gaps use `xl` (32px). No web-style 80–120px section gaps — apps don't have sections, they have screens.

## Elevation & Depth

No shadows. Hierarchy is conveyed entirely through tonal layering on the dark surface:

- Base content sits on `surface` (#0B0F1A)
- Cards and grouped content sit on `surface-container` (#141A2A)
- The most prominent card (balance, active modal) uses `surface-container-high` (#1B2235)
- Bottom sheets use `surface-container` with a 1px `outline` top border

Tab bar uses `surface` with a subtle `outline` top border. The home indicator area is `surface` (no glass blur — battery cost not worth it).

## Shapes

Mixed radii by purpose, never combined randomly:

- `rounded.full` — pills (category, primary CTA), avatars
- `rounded.lg` (20px) — content cards (balance, summaries)
- `rounded.md` (14px) — inputs, secondary buttons
- `rounded.sm` (8px) — tooltips, small badges
- Sharp (0) — full-width list rows, tab bar dividers

Pill CTAs are the visual anchor of every screen — even when small, they read as "tap me."

## Components

Defined in YAML above. Notes:

- **balance-card** is the hero of the home screen. Always uses display-lg, always primary-container background, always 24px padding. No variants.
- **transaction-row** has a fixed 64px height — no exceptions, even for long merchant names (truncate with ellipsis). Consistent rhythm matters more than completeness.
- **category-pill** is the only place we use `surface-container-high` for a small element. Color must be paired with its corresponding category icon (color-coded).
- **button-primary** uses `rounded.full` — pills, never rectangles. `padding: 0 24px` for variable width based on content.
- **tab-bar-item** active state is the **only** place `colors.primary` appears in tab bar. Inactive items use `on-surface-variant`. No background color change on active — let the color do the work.

## Do's and Don'ts

- **Do** use mint (`primary`) only for one purpose per category: positive amounts, primary CTA, active tab. Pick one role per screen.
- **Don't** use mint for section backgrounds, decorative dots, or anything non-actionable. Cheapens the signal.
- **Do** use tabular figures (`tnum`) on every numeric column. Misalignment in a finance app reads as "broken."
- **Don't** mix `rounded.full` and `rounded.sm` in the same row — pick one shape language per region.
- **Do** keep transaction rows at 64px even when content is short. Consistent rhythm.
- **Don't** add shadows to elevate. Use tonal layering. Shadows on dark backgrounds always look smudged.
- **Do** show real amounts in mockups (`$1,247.80`, not `$0.00`).
- **Don't** use emoji as category icons. Use real iconography (Iconify lucide or ph) with category-coded background colors.
