# SVG Illustration Patterns

Reusable building blocks for inline SVG illustrations in Gate 3 mockups.
These are starting points — adapt colors, proportions, and composition
to match the product's palette and tone.

All patterns use CSS custom properties so they automatically match the
mockup's design system:
- `var(--primary)` — brand primary color
- `var(--secondary)` — brand secondary (if defined)
- `var(--accent)` — accent color
- `var(--neutral-100)` through `var(--neutral-900)` — gray scale

## Composition Rules

1. **Max 80 SVG lines per illustration.** Simpler is better.
2. **Use a ground shadow** (ellipse at bottom) to anchor floating objects.
3. **Layering order:** background shapes → main object → person/user →
   accent details → floating decorative shapes.
4. **Consistent stroke width:** If using strokes, pick ONE width (1.5 or 2)
   and apply everywhere. Mixed stroke widths look unfinished.
5. **Color limit:** Max 4 colors per illustration (primary, neutral, accent,
   white). More colors = visual noise.

## Pattern: Person Silhouette (upper body)

Use when: any illustration that needs a human presence.

```svg
<!-- Person: upper body silhouette, centered at (cx, cy) -->
<!-- Head -->
<circle cx="{cx}" cy="{cy}" r="18" fill="var(--primary)" opacity="0.15" />
<!-- Body -->
<rect x="{cx-14}" y="{cy+22}" width="28" height="35" rx="6"
      fill="var(--primary)" opacity="0.15" />
<!-- Arms (optional, for interaction poses) -->
<rect x="{cx+16}" y="{cy+28}" width="20" height="6" rx="3"
      fill="var(--primary)" opacity="0.12" transform="rotate(-15 {cx+16} {cy+28})" />
```

## Pattern: Monitor / Screen

Use when: tech products, dashboards, SaaS.

```svg
<!-- Monitor centered at (cx, cy), size (w, h) -->
<rect x="{cx-w/2}" y="{cy-h/2}" width="{w}" height="{h}" rx="4"
      fill="white" stroke="var(--neutral-300)" stroke-width="1.5" />
<!-- Screen content area (inset 8px) -->
<rect x="{cx-w/2+8}" y="{cy-h/2+8}" width="{w-16}" height="{h-24}" rx="2"
      fill="var(--neutral-50)" />
<!-- Stand -->
<rect x="{cx-10}" y="{cy+h/2}" width="20" height="15" rx="2"
      fill="var(--neutral-300)" />
<!-- Base -->
<rect x="{cx-25}" y="{cy+h/2+15}" width="50" height="4" rx="2"
      fill="var(--neutral-200)" />
```

## Pattern: Clipboard / Document

Use when: medical, legal, forms, reports.

```svg
<!-- Clipboard at (cx, cy) -->
<rect x="{cx-30}" y="{cy-40}" width="60" height="80" rx="4"
      fill="white" stroke="var(--neutral-300)" stroke-width="1.5" />
<!-- Clip -->
<rect x="{cx-10}" y="{cy-44}" width="20" height="10" rx="3"
      fill="var(--neutral-400)" />
<!-- Text lines -->
<rect x="{cx-20}" y="{cy-25}" width="40" height="3" rx="1" fill="var(--neutral-200)" />
<rect x="{cx-20}" y="{cy-17}" width="30" height="3" rx="1" fill="var(--neutral-200)" />
<rect x="{cx-20}" y="{cy-9}" width="35" height="3" rx="1" fill="var(--neutral-200)" />
<!-- Checkmark -->
<polyline points="{cx-20},{cy+10} {cx-14},{cy+16} {cx-4},{cy+2}"
          fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" />
```

## Pattern: Shopping Bag

Use when: e-commerce, retail.

```svg
<!-- Bag at (cx, cy) -->
<rect x="{cx-25}" y="{cy-15}" width="50" height="45" rx="4"
      fill="var(--primary)" opacity="0.12" stroke="var(--primary)" stroke-width="1.5" />
<!-- Handles -->
<path d="M {cx-12} {cy-15} Q {cx-12} {cy-30} {cx} {cy-30}
        Q {cx+12} {cy-30} {cx+12} {cy-15}"
      fill="none" stroke="var(--primary)" stroke-width="1.5" />
```

## Pattern: Shield / Security

Use when: trust, security, fintech, health data.

```svg
<!-- Shield at (cx, cy) -->
<path d="M {cx} {cy-25} L {cx+22} {cy-15} L {cx+20} {cy+10}
        Q {cx} {cy+25} {cx-20} {cy+10} L {cx-22} {cy-15} Z"
      fill="var(--primary)" opacity="0.1" stroke="var(--primary)" stroke-width="1.5" />
<!-- Checkmark inside -->
<polyline points="{cx-8},{cy-2} {cx-2},{cy+5} {cx+10},{cy-8}"
          fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" />
```

## Pattern: Chart / Trend Up

Use when: analytics, growth, investment, KPI.

```svg
<!-- Chart frame at (cx, cy) -->
<rect x="{cx-35}" y="{cy-25}" width="70" height="50" rx="4"
      fill="white" stroke="var(--neutral-200)" stroke-width="1" />
<!-- Trend line going up -->
<polyline points="{cx-25},{cy+10} {cx-10},{cy+5} {cx},{cy-5} {cx+15},{cy-15}"
          fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" />
<!-- Data dots -->
<circle cx="{cx-25}" cy="{cy+10}" r="3" fill="var(--accent)" />
<circle cx="{cx-10}" cy="{cy+5}" r="3" fill="var(--accent)" />
<circle cx="{cx}" cy="{cy-5}" r="3" fill="var(--accent)" />
<circle cx="{cx+15}" cy="{cy-15}" r="3" fill="var(--accent)" />
```

## Pattern: Floating Accent Shapes

Use when: hero sections, landing pages (spacious areas only).

```svg
<!-- Scatter these around hero area at various positions -->
<circle cx="50" cy="80" r="12" fill="var(--primary)" opacity="0.08" />
<circle cx="350" cy="40" r="8" fill="var(--accent)" opacity="0.12" />
<rect x="320" y="250" width="16" height="16" rx="4"
      fill="var(--secondary)" opacity="0.1" transform="rotate(15 328 258)" />
<!-- Apply CSS animation for subtle floating -->
<!-- .accent-float { animation: float 4s ease-in-out infinite; } -->
```

## Pattern: Ground Shadow

Use when: anchoring any standing illustration.

```svg
<ellipse cx="{cx}" cy="{ground_y}" rx="{width*0.6}" ry="{width*0.08}"
         fill="var(--neutral-200)" opacity="0.5" />
```

## Composition Example: Medical Clinic Hero

Combines: person + monitor + clipboard + accents + ground shadow.

```svg
<svg viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg" class="hero-illustration">
  <!-- Ground shadow -->
  <ellipse cx="250" cy="320" rx="200" ry="20" fill="var(--neutral-200)" opacity="0.4" />

  <!-- Doctor silhouette (left) -->
  <circle cx="150" cy="120" r="22" fill="var(--primary)" opacity="0.15" />
  <rect x="132" y="148" width="36" height="50" rx="8" fill="var(--primary)" opacity="0.15" />
  <!-- Stethoscope hint -->
  <path d="M 145 155 Q 140 175 155 180" fill="none" stroke="var(--primary)" stroke-width="1.5" opacity="0.3" />

  <!-- Monitor (right) -->
  <rect x="260" y="80" width="130" height="95" rx="6" fill="white" stroke="var(--neutral-300)" stroke-width="1.5" />
  <rect x="270" y="90" width="110" height="65" rx="2" fill="var(--neutral-50)" />
  <!-- X-ray hint inside monitor -->
  <ellipse cx="325" cy="115" rx="20" ry="22" fill="none" stroke="var(--neutral-300)" stroke-width="1" />
  <rect x="310" y="135" width="30" height="10" rx="2" fill="var(--neutral-200)" />
  <!-- Stand -->
  <rect x="315" y="175" width="20" height="18" fill="var(--neutral-300)" />
  <rect x="300" y="193" width="50" height="4" rx="2" fill="var(--neutral-200)" />

  <!-- Clipboard (between) -->
  <rect x="210" y="150" width="40" height="55" rx="3" fill="white" stroke="var(--neutral-300)" stroke-width="1" />
  <rect x="222" y="146" width="16" height="8" rx="2" fill="var(--neutral-400)" />
  <rect x="218" y="165" width="24" height="2" rx="1" fill="var(--neutral-200)" />
  <rect x="218" y="172" width="20" height="2" rx="1" fill="var(--neutral-200)" />
  <rect x="218" y="179" width="22" height="2" rx="1" fill="var(--neutral-200)" />

  <!-- Accent shapes -->
  <circle cx="420" cy="60" r="10" fill="var(--accent)" opacity="0.12" class="accent-float" />
  <circle cx="80" cy="80" r="7" fill="var(--primary)" opacity="0.1" class="accent-float" style="animation-delay:-2s" />
  <rect x="400" y="250" width="12" height="12" rx="3" fill="var(--secondary, var(--primary))" opacity="0.08" transform="rotate(20 406 256)" class="accent-float" style="animation-delay:-1s" />
</svg>
```
