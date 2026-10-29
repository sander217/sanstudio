---
version: alpha
name: My Brand Taste
description: |
  Your brand's taste, loaded by Gate 3 as defaults. Copy this file to TASTE.md
  in your project root and edit. The session DESIGN.md overrides any token here.
  Craft rules (skills/design-lock/references/craft-rules.md) always apply on top.
colors:
  # Neutral surfaces. Avoid pure #000 and #fff.
  surface: "#FAFAF7"
  surface-dark: "#1A1C1E"
  on-surface: "#1A1C1E"
  on-surface-dark: "#F4F4F2"
  # Leave primary and accent empty to let each project choose. Fill them to
  # pin a brand color across every project.
  # primary: "#1F3A5F"
  # accent: "#C8553D"
typography:
  # heading: "Clash Display"
  # body: "Switzer"
---

# Taste

> Partial DESIGN.md. Gate 3 loads it after the craft rules. Everything here is a
> default you own; the session DESIGN.md wins when it specifies a value.

## Overview

Write three to five sentences on how your product should feel. Name the
reference world (editorial, utilitarian, playful, luxury) and what you reject.

## Colors

How many colors per screen, which family the primary comes from, what the
accent is allowed to do. Semantic colors (success, danger) are not counted
against the limit but still restrained.

## Typography

Scale steps, weights used for hierarchy, any pairing rule. Name your display
and body faces here and say in one line why they fit your brand. Craft rule
`CR-TYPE-002` accepts any face, Inter included, as long as it was chosen from
the brief and style rather than defaulted.

- Display:
- Body:
- Figures / code (optional, one role only):

## Gradient

Leave this section out and no gradient will be used. To allow one, declare
a recipe. Craft rule `CR-COLOR-005` enforces one hue family, three stops at
most, lightness-driven, readable ink at the lightest stop, never on text or
inside chips.

```yaml
gradient:
  name:
  hue:            # OKLCH hue range, e.g. 258-262
  stops:
    - { name: dark,  hex: "" }
    - { name: mid,   hex: "" }
    - { name: light, hex: "" }
  direction:      # e.g. 160deg
  ink-on-top:     # the text color that must pass contrast at the lightest stop
  allowed-on:     # hero field, one section band, primary CTA
  never-on:       # text, chips, inputs, body copy backgrounds
```

## Layout

Density, white space, default composition (single column, asymmetric, grid),
and what you consider a web pattern that must not appear in an app. Craft
rules `CR-SPACE-001`, `CR-SPACE-002` and `UI-TAB-001` already guarantee
gutters, 8px text insets and padded tab labels; write here only if your brand
wants more room than that.

## Elevation & Depth

Shadows or none, how containers separate (surface difference, hairline, space).

## Shapes

Corner radius family, pill usage, icon style (outline or filled, stroke width).

## Components

Component-level preferences: button hierarchy, chip policy, list row anatomy.

## Do's and Don'ts

Write them as lint rules. One line each. These are added to the session's
binding rules.

### Do

- Do use real content in every mockup: real names, amounts and dates.
- Do keep one focal point per screen.

### Don't

- Don't use more than three colors on one screen.
- Don't use a web hero section inside a phone frame.

## Dislikes

Free-form list. Gate 3 scans it before the final checklist.

- Example: rainbow chips used as information.
- Example: every card with a drop shadow.
