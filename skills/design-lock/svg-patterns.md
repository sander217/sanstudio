# SVG Icon and Mark Patterns

Reusable building blocks for inline SVG icons, simplified logo marks, and tiny
data visualizations in Gate 3 mockups.

This file is intentionally icon-only. Do not use these patterns for hero scenes,
section illustrations, people, environments, product depictions, or decorative
art. Section visuals are routed through photography or CSS-only treatments in
`design-lock-SKILL.md`.

All patterns use CSS custom properties so they automatically match the mockup's
design system:
- `currentColor` for icon stroke/fill when possible
- `var(--primary)` for brand-led emphasis
- `var(--neutral-300)` through `var(--neutral-700)` for neutral UI states
- `var(--success)`, `var(--warning)`, `var(--danger)` for semantic status

## Usage Rules

1. **Icons stay small.** Default size is 16-24px. Do not exceed 32px unless
   the pattern is a logo mark or mini chart.
2. **One stroke system.** Use either `1.5` or `2` for a whole screen.
3. **Keep icons simple.** Under 20 SVG lines per icon. If it needs a paragraph
   to explain, it is not an icon.
4. **Use semantic color sparingly.** Neutral by default. Add semantic color only
   when the icon communicates state.
5. **Logo marks are placeholders, not fake brands.** Build restrained geometric
   marks for headers, footers, and social-proof rows.
6. **Data viz stays tiny and informative.** Sparklines, progress bars, and
   trend chips are allowed. Decorative charts are not.

## Pattern: Lock Icon

Use when: security, privacy, payment trust, protected content.

```svg
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="5" y="10" width="14" height="10" rx="2"
        stroke="currentColor" stroke-width="1.8" />
  <path d="M8 10V7a4 4 0 1 1 8 0v3"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
</svg>
```

## Pattern: Shield Icon

Use when: trust badges, compliance, guarantees, verified states.

```svg
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 3 18 5.5V11c0 4.1-2.3 7.2-6 9-3.7-1.8-6-4.9-6-9V5.5L12 3Z"
        stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
  <path d="m9.2 11.8 1.9 1.9 3.7-4.3"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

## Pattern: Search Icon

Use when: search bars, empty states, discovery filters.

```svg
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="11" cy="11" r="6"
          stroke="currentColor" stroke-width="1.8" />
  <path d="m16 16 3.5 3.5"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
</svg>
```

## Pattern: Check Circle

Use when: success states, completed steps, confirmations.

```svg
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="9"
          stroke="currentColor" stroke-width="1.8" />
  <path d="m8.5 12.2 2.3 2.3 4.7-5"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

## Pattern: Warning Triangle

Use when: caution, risky actions, destructive states, errors.

```svg
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 4 20 19H4L12 4Z"
        stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
  <path d="M12 9v4"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="12" cy="16.5" r="1" fill="currentColor" />
</svg>
```

## Pattern: Chevron / Arrow

Use when: navigation, disclosure, forward actions.

```svg
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="m9 6 6 6-6 6"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

## Pattern: Avatar Dot

Use when: collaboration presence, status indicators, live users.

```svg
<svg viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="10" fill="var(--neutral-300)" />
  <circle cx="12" cy="9" r="3" fill="white" />
  <path d="M7.5 18a4.5 4.5 0 0 1 9 0"
        fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" />
</svg>
```

## Pattern: Mini Sparkline

Use when: KPI cards, dashboard trends, compact summaries.

```svg
<svg viewBox="0 0 100 30" fill="none" aria-hidden="true">
  <polyline points="4,22 18,20 32,16 46,18 60,12 74,10 88,6 96,8"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

## Pattern: Progress Bar

Use when: onboarding, uploads, completion states.

```svg
<svg viewBox="0 0 120 8" aria-hidden="true">
  <rect x="0" y="0" width="120" height="8" rx="4" fill="var(--neutral-200)" />
  <rect x="0" y="0" width="72" height="8" rx="4" fill="currentColor" />
</svg>
```

## Pattern: Logo Mark

Use when: provisional header/footer branding or monochrome social-proof marks.

```svg
<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <rect x="4" y="4" width="24" height="24" rx="8" fill="currentColor" />
  <path d="M11 20V12h4.5c2.4 0 4 1.4 4 3.5S17.9 20 15.5 20H11Z"
        fill="white" />
</svg>
```

## Pattern: Monoline Wordmark Separator

Use when: header lockups, footer branding rows, social proof dividers.

```svg
<svg viewBox="0 0 64 8" fill="none" aria-hidden="true">
  <path d="M4 4h56"
        stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 4" />
</svg>
```

## Composition Guidance

- Pair icons with concise labels. Icons without text should still be obvious.
- Use one icon style family per screen: all rounded, or all sharp, but not both.
- Logo rows should be grayscale or single-color unless a real brand asset exists.
- For empty/error states, one icon plus strong guidance text is enough.
- For data-heavy screens, prefer mini charts over decorative marks.
