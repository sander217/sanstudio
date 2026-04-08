# SVG Illustration Patterns

Reusable building blocks for inline SVG illustrations in Gate 3 mockups.
These are starting points — adapt colors, proportions, and composition
to match the product's palette and tone.

The examples in this file are not default scene choices. Only use a pattern
when the current section's text calls for that subject. Do not carry over
parking, clinic, vehicle, booking, or other example motifs into unrelated work.

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

## Pattern: Vehicle (side view)

Use when: parking, traffic, delivery, transportation, logistics.

```svg
<!-- Car side-view at (cx, cy), width ~80px -->
<rect x="{cx-40}" y="{cy-12}" width="80" height="24" rx="8"
      fill="var(--primary)" opacity="0.15" />
<!-- Windshield -->
<path d="M {cx+5} {cy-12} L {cx+15} {cy-24} L {cx+30} {cy-24} L {cx+35} {cy-12}"
      fill="var(--primary)" opacity="0.08" />
<!-- Wheels -->
<circle cx="{cx-22}" cy="{cy+12}" r="8" fill="var(--neutral-400)" />
<circle cx="{cx+22}" cy="{cy+12}" r="8" fill="var(--neutral-400)" />
<circle cx="{cx-22}" cy="{cy+12}" r="4" fill="var(--neutral-200)" />
<circle cx="{cx+22}" cy="{cy+12}" r="4" fill="var(--neutral-200)" />
```

## Pattern: Building Facade

Use when: clinic, office, store, restaurant, school, hospital, any physical location.

```svg
<!-- Building at (cx, cy), width ~100, height ~80 -->
<rect x="{cx-50}" y="{cy-40}" width="100" height="80" rx="4"
      fill="var(--neutral-100)" stroke="var(--neutral-300)" stroke-width="1" />
<!-- Door -->
<rect x="{cx-10}" y="{cy+10}" width="20" height="30" rx="2"
      fill="var(--primary)" opacity="0.1" stroke="var(--neutral-300)" stroke-width="1" />
<!-- Windows (2x2 grid) -->
<rect x="{cx-35}" y="{cy-28}" width="18" height="14" rx="2" fill="var(--neutral-200)" />
<rect x="{cx+17}" y="{cy-28}" width="18" height="14" rx="2" fill="var(--neutral-200)" />
<rect x="{cx-35}" y="{cy-6}" width="18" height="14" rx="2" fill="var(--neutral-200)" />
<rect x="{cx+17}" y="{cy-6}" width="18" height="14" rx="2" fill="var(--neutral-200)" />
<!-- Roof line or sign area -->
<rect x="{cx-50}" y="{cy-44}" width="100" height="6" rx="1" fill="var(--neutral-300)" />
```

## Pattern: Queue / Waiting Line

Use when: waiting, crowding, queuing, congestion, bottleneck.

```svg
<!-- 4 people in a line, each progressively fainter, at (startX, cy) -->
<g opacity="1">
  <circle cx="{startX}" cy="{cy}" r="10" fill="var(--primary)" opacity="0.15" />
  <rect x="{startX-7}" y="{cy+13}" width="14" height="18" rx="4" fill="var(--primary)" opacity="0.15" />
</g>
<g opacity="0.7">
  <circle cx="{startX+30}" cy="{cy}" r="10" fill="var(--primary)" opacity="0.15" />
  <rect x="{startX+23}" y="{cy+13}" width="14" height="18" rx="4" fill="var(--primary)" opacity="0.15" />
</g>
<g opacity="0.5">
  <circle cx="{startX+55}" cy="{cy}" r="10" fill="var(--primary)" opacity="0.15" />
  <rect x="{startX+48}" y="{cy+13}" width="14" height="18" rx="4" fill="var(--primary)" opacity="0.15" />
</g>
<g opacity="0.3">
  <circle cx="{startX+80}" cy="{cy}" r="10" fill="var(--primary)" opacity="0.15" />
  <rect x="{startX+73}" y="{cy+13}" width="14" height="18" rx="4" fill="var(--primary)" opacity="0.15" />
</g>
```

## Pattern: Clock / Time

Use when: waiting time, scheduling, save time, time management.

```svg
<!-- Clock at (cx, cy), radius r -->
<circle cx="{cx}" cy="{cy}" r="{r}" fill="white"
        stroke="var(--neutral-300)" stroke-width="1.5" />
<!-- Hour hand -->
<line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy-r*0.5}"
      stroke="var(--neutral-600)" stroke-width="2" stroke-linecap="round" />
<!-- Minute hand -->
<line x1="{cx}" y1="{cy}" x2="{cx+r*0.45}" y2="{cy-r*0.2}"
      stroke="var(--neutral-600)" stroke-width="1.5" stroke-linecap="round" />
<!-- Center dot -->
<circle cx="{cx}" cy="{cy}" r="2" fill="var(--neutral-600)" />
```

## Pattern: Exclamation / Problem Indicator

Use when: pain point, issue, warning, problem statement.

```svg
<!-- Problem indicator at (cx, cy) -->
<circle cx="{cx}" cy="{cy}" r="14" fill="var(--accent)" opacity="0.12" />
<text x="{cx}" y="{cy+5}" text-anchor="middle" font-size="16" font-weight="700"
      fill="var(--accent)">!</text>
```

## Pattern: Checkmark / Solution Indicator

Use when: solution, benefit, success, completed, resolved.

```svg
<!-- Solution indicator at (cx, cy) -->
<circle cx="{cx}" cy="{cy}" r="14" fill="var(--primary)" opacity="0.1" />
<polyline points="{cx-6},{cy} {cx-1},{cy+5} {cx+7},{cy-5}"
          fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" />
```

## Pattern: Phone with UI

Use when: mobile app, booking, online service, app feature.

```svg
<!-- Phone at (cx, cy), roughly 50x90 -->
<rect x="{cx-25}" y="{cy-45}" width="50" height="90" rx="8"
      fill="white" stroke="var(--neutral-300)" stroke-width="1.5" />
<!-- Screen -->
<rect x="{cx-20}" y="{cy-36}" width="40" height="68" rx="2"
      fill="var(--neutral-50)" />
<!-- Status bar hint -->
<rect x="{cx-15}" y="{cy-33}" width="30" height="2" rx="1" fill="var(--neutral-200)" />
<!-- Content lines -->
<rect x="{cx-15}" y="{cy-20}" width="30" height="3" rx="1" fill="var(--neutral-200)" />
<rect x="{cx-15}" y="{cy-12}" width="22" height="3" rx="1" fill="var(--neutral-200)" />
<!-- CTA button hint -->
<rect x="{cx-15}" y="{cy+10}" width="30" height="10" rx="4"
      fill="var(--primary)" opacity="0.2" />
<!-- Home indicator -->
<rect x="{cx-10}" y="{cy+36}" width="20" height="3" rx="1.5" fill="var(--neutral-300)" />
```

## Pattern: Calendar Grid

Use when: booking, scheduling, appointment, date selection.

```svg
<!-- Calendar at (cx, cy), roughly 80x70 -->
<rect x="{cx-40}" y="{cy-35}" width="80" height="70" rx="4"
      fill="white" stroke="var(--neutral-300)" stroke-width="1" />
<!-- Header bar -->
<rect x="{cx-40}" y="{cy-35}" width="80" height="16" rx="4"
      fill="var(--primary)" opacity="0.1" />
<!-- Day cells (simplified 4x3 grid) -->
<g font-size="8" fill="var(--neutral-400)" text-anchor="middle">
  <text x="{cx-25}" y="{cy-8}">12</text>
  <text x="{cx-8}" y="{cy-8}">13</text>
  <text x="{cx+9}" y="{cy-8}">14</text>
  <text x="{cx+26}" y="{cy-8}">15</text>
  <text x="{cx-25}" y="{cy+6}">19</text>
  <text x="{cx-8}" y="{cy+6}">20</text>
  <text x="{cx+9}" y="{cy+6}">21</text>
  <text x="{cx+26}" y="{cy+6}">22</text>
</g>
<!-- Selected day highlight -->
<circle cx="{cx-8}" cy="{cy+3}" r="8" fill="var(--primary)" opacity="0.15" />
```

## Pattern: Parking Lot (top view)

Use when: parking problem, vehicle management, space allocation.

```svg
<!-- Parking area at (cx, cy) -->
<!-- Lot outline -->
<rect x="{cx-60}" y="{cy-40}" width="120" height="80" rx="4"
      fill="var(--neutral-100)" stroke="var(--neutral-300)" stroke-width="1" stroke-dasharray="4 2" />
<!-- Parking lines -->
<line x1="{cx-30}" y1="{cy-40}" x2="{cx-30}" y2="{cy+40}" stroke="var(--neutral-300)" stroke-width="1" />
<line x1="{cx}" y1="{cy-40}" x2="{cx}" y2="{cy+40}" stroke="var(--neutral-300)" stroke-width="1" />
<line x1="{cx+30}" y1="{cy-40}" x2="{cx+30}" y2="{cy+40}" stroke="var(--neutral-300)" stroke-width="1" />
<!-- Parked cars (top-view rectangles) -->
<rect x="{cx-55}" y="{cy-25}" width="20" height="35" rx="4" fill="var(--neutral-400)" opacity="0.3" />
<rect x="{cx-25}" y="{cy-25}" width="20" height="35" rx="4" fill="var(--neutral-400)" opacity="0.3" />
<rect x="{cx+5}" y="{cy-25}" width="20" height="35" rx="4" fill="var(--primary)" opacity="0.2" />
<!-- Empty spot indicator -->
<rect x="{cx+35}" y="{cy-25}" width="20" height="35" rx="4"
      fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3" />
<text x="{cx+45}" y="{cy}" text-anchor="middle" font-size="10" fill="var(--accent)">P</text>
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

## Composition Example: Parking Problem Scene

Combines: parking lot + cars + building + problem indicator.

```svg
<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" class="section-illustration">
  <!-- Ground -->
  <rect x="0" y="250" width="500" height="50" fill="var(--neutral-100)" />

  <!-- Clinic building (background) -->
  <rect x="300" y="100" width="140" height="150" rx="4" fill="var(--neutral-50)" stroke="var(--neutral-200)" />
  <rect x="350" y="220" width="30" height="30" rx="2" fill="var(--primary)" opacity="0.08" stroke="var(--neutral-300)" />
  <rect x="320" y="120" width="25" height="18" rx="2" fill="var(--neutral-200)" />
  <rect x="370" y="120" width="25" height="18" rx="2" fill="var(--neutral-200)" />
  <rect x="320" y="155" width="25" height="18" rx="2" fill="var(--neutral-200)" />
  <rect x="370" y="155" width="25" height="18" rx="2" fill="var(--neutral-200)" />
  <!-- Cross symbol (clinic) -->
  <rect x="357" y="90" width="16" height="4" rx="1" fill="var(--primary)" opacity="0.3" />
  <rect x="363" y="84" width="4" height="16" rx="1" fill="var(--primary)" opacity="0.3" />

  <!-- Parking lot -->
  <rect x="40" y="160" width="220" height="90" rx="4" fill="var(--neutral-50)" stroke="var(--neutral-200)" stroke-dasharray="4 2" />
  <!-- Lines -->
  <line x1="95" y1="160" x2="95" y2="250" stroke="var(--neutral-200)" />
  <line x1="150" y1="160" x2="150" y2="250" stroke="var(--neutral-200)" />
  <line x1="205" y1="160" x2="205" y2="250" stroke="var(--neutral-200)" />
  <!-- Cars (packed) -->
  <rect x="52" y="175" width="30" height="55" rx="6" fill="var(--neutral-400)" opacity="0.25" />
  <rect x="107" y="175" width="30" height="55" rx="6" fill="var(--neutral-400)" opacity="0.25" />
  <rect x="162" y="175" width="30" height="55" rx="6" fill="var(--neutral-400)" opacity="0.25" />
  <rect x="217" y="175" width="30" height="55" rx="6" fill="var(--primary)" opacity="0.15" />

  <!-- Problem indicator: car circling -->
  <path d="M 80 140 Q 150 110 220 140" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.5" />
  <!-- Circling car -->
  <rect x="70" y="130" width="18" height="28" rx="4" fill="var(--accent)" opacity="0.2" />
  <!-- Exclamation -->
  <circle cx="79" cy="115" r="8" fill="var(--accent)" opacity="0.15" />
  <text x="79" y="119" text-anchor="middle" font-size="10" font-weight="700" fill="var(--accent)">!</text>

  <!-- "P" label -->
  <text x="150" y="155" text-anchor="middle" font-size="11" font-weight="600" fill="var(--neutral-400)">P</text>
</svg>
```
