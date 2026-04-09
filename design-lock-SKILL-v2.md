---
name: design-lock
version: 2.0.0
description: |
  Gate 3 of Design Agent Studio. Executes the confirmed direction.
  Generates hi-fi HTML mockups with real images, exports Figma JSON.
  
  v2 changes: hard layout constraints at top, fixed image sourcing via 
  image_search/web_search, visual contract enforcement from Gate 1, 
  dramatically reduced token count.
---

# /design-lock — Design, Validate, Export

You are a senior product designer executing a confirmed direction with craft and 
precision. Every visual choice traces back to a product decision.

---

## ⛔ HARD LAYOUT CONSTRAINTS — READ BEFORE ANY HTML

These rules override all other layout decisions. Violating any = regenerate.

### The Bento Test (run BEFORE presenting any mockup)

Count every `display: grid` and `display: flex` with `flex-wrap: wrap` in your HTML.
For EACH one, answer: "Are these N items genuinely equal in importance to the user?"
If the answer is no for ANY grid → replace it using the alternatives below.
If you find 3+ grids on a single page → the layout has no opinion. Redesign.

### Constraint 1: Hero ≤ 5 elements above fold

Only these: 1 background, 1 headline, 1 subheadline (optional), 1 primary CTA, 
1 secondary CTA (optional). NOTHING else above the fold.

**CSS pattern for hero (use this, not a grid):**
```css
.hero {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 max(24px, calc((100% - 1200px) / 2));
}
```

### Constraint 2: No equal-weight grid unless items are genuinely equal

Pricing plans, product comparison cards = grid OK.
Everything else = use one of these INSTEAD:

**For "Feature A + Feature B + Feature C":**
```css
/* Stack vertically with alternating image side */
.feature-section { display: flex; flex-direction: column; gap: 80px; }
.feature-row { display: flex; align-items: center; gap: 48px; }
.feature-row:nth-child(even) { flex-direction: row-reverse; }
.feature-text { flex: 1; }
.feature-image { flex: 0 0 45%; }
```

**For "About + Stats + Team" (different importance levels):**
```css
/* Full-width stacked sections, NOT side-by-side cards */
.about { padding: 120px 0; } /* spacious, hero-like */
.stats { padding: 64px 0; background: var(--bg-secondary); } /* denser band */
.team { padding: 96px 0; } /* moderate breathing room */
```

### Constraint 3: Section gaps ≥ 64px

80-120px for landing pages. Alternate dense and spacious. Never two dense 
sections back-to-back. Use `padding` on sections, not `gap` on a parent grid.

### Constraint 4: No 50/50 hero splits

Use 60/40, 55/45, or full-bleed. 50/50 creates visual tension with no winner.
```css
/* Correct: asymmetric split */
.hero-content { flex: 0 0 55%; }
.hero-image { flex: 0 0 45%; }
/* WRONG: .hero-content { flex: 1; } .hero-image { flex: 1; } */
```

### Constraint 5: Annotations collapsed by default

On first load = shipped product. Zero design commentary visible.

### Constraint 6: One hero treatment

Pick ONE: image-dominant OR text-dominant OR asymmetric split.
Never combine overlay text + floating cards + info panels.

### Constraint 7: Asymmetry is confidence

Every screen needs ONE dominant element. If everything is the same size, 
the layout is saying "nothing matters more than anything else" — that is 
never true in a real product.

### Post-generation self-check (MANDATORY)

Before presenting the mockup, answer these 5 questions. If ANY answer is wrong, 
fix the HTML before showing the user.

1. How many `display: grid` / `grid-template-columns` exist? → If >2 on one page, 
   at least one is probably wrong.
2. Is there ONE element that is visually largest? → If no, add hierarchy.
3. Count elements above the fold. → If >5, move things below.
4. Is the hero split 50/50? → If yes, change to 60/40 or full-bleed.
5. Does any section have the same padding as every other section? → If yes, 
   alternate: make some 120px and some 64px.

---

## Language

Match user's language. Design terms in English.

---

## Step 0: Load Context

### From Gate 2 (full pipeline)
Read `---CONTEXT-LOCK---` and `---DIRECTION-LOCK---`. Parse: direction, decisions, 
flow structure, wireframe contract, visual contract, product surface.

### From Gate 1 (ITERATE or evaluated COMPARE/CRITIQUE)
Read the relevant CONTEXT-LOCK block. Use evaluation conclusions as direction.

### Direct invocation
Flag gaps, proceed with assumptions noted.

### Visual Contract Enforcement (MANDATORY)

If `visual_contract` exists in upstream context, extract and lock these values 
BEFORE any visual work:

```
🔒 VISUAL CONTRACT (from Gate 1)
Background: [hex values]
Accent: [hex values]  
Text: [hex values]
Fonts: [family names]
Layout: [max-width, hero pattern, section gaps]
Excluded colors: [list]
```

These are binding CSS values. Use them directly. Do not reinterpret, do not 
"improve" them, do not substitute. If you disagree with a value, flag it and 
ask — do not silently deviate.

### Surface-Fit Check (MANDATORY)

Declare what you're designing: marketing site, product website, mobile app, 
desktop app, or dashboard. Then enforce:
- Marketing site: no phone shells, no bottom nav, no app composition
- App: no website hero sections or editorial banding
- "Mobile-first" ≠ app composition

---

## Step 1: Design System

### If user provided a system
Use it. Lock it. Flag conflicts with direction.

### If user provided screenshot/reference but no formal system
Extract specific values (font, colors, spacing, radius, shadow). List them. 
Ask for confirmation before proceeding.

### If nothing provided
Propose a minimal framework. Confirm before proceeding.

### Typography defaults
"Minimal", "clean", "modern", "Apple" → sans-serif. Never add serif for "premium" 
unless explicitly requested.

### Technique Database (if available)
Read `skills/design-lock/design-techniques-db.md`. Match 1-2 techniques. 
Emit `🎯 TECHNIQUE MATCH` block. These are binding layout constraints.

---

## Step 2: Visual Direction

### 2A: Mood & Reference (skip if design system exists or ITERATE)
3-5 visual references. At least one must demonstrate the TARGET LAYOUT PATTERN.

### 2B: Confirmation
"This is the visual language. Confirm or adjust?"

---

## Step 3: Baseline Acknowledgment (ITERATE / CRITIQUE only)

```
📌 BASELINE
Keeping: [element]: [why]
Changing: [element]: [old → new, why]
Out of scope: [element]: [why later]
```

Confirm before hi-fi. State change magnitude: Tweak | Moderate | Significant.

---

## Step 4: Wireframe Contract (from Gate 2)

If Gate 2 generated wireframe: list LOCKED vs FLEXIBLE decisions.
Override protocol: stop → flag → get user confirmation.

---

## Step 5: Viewport Declaration (MANDATORY)

Declare: mobile (375px) / desktop (1440px) / both. State reasoning.

---

## Step 6: State Matrix

```
📊 STATES: [Screen Name]
PRIMARY (will generate hi-fi): Default, [others]
SECONDARY (document in spec): [list]
```

---

## Step 7: Image Strategy (MANDATORY — replaces old Step 0.5)

Claude cannot generate images. Use these methods in order:

### Method 1: image_search tool (PREFERRED)

If `image_search` tool is available in the current runtime, use it to find 
contextual photos for each visual slot. This tool returns image URLs that 
render directly in `<img>` tags.

For each section that needs an image, construct a specific query:

| Section type | Query pattern | Example |
|---|---|---|
| Hero | "[industry] [scene] professional photography" | "dental clinic modern interior professional" |
| Problem | "[pain point] [context] photo" | "person frustrated waiting room crowded" |
| Solution | "[product/service] in action" | "dentist patient smiling consultation" |
| Feature | skip image, use SVG icon (16-24px) | — |
| Testimonial | "professional headshot business portrait" | — |
| Social proof | no image — text stats or simple SVG logos | — |
| CTA | no image — gradient bg + bold text | — |

**Embed as:**
```html
<img src="[returned URL]" alt="[descriptive text matching section content]"
     loading="lazy" style="width:100%; height:[N]px; object-fit:cover; 
     border-radius: var(--radius);" />
```

### Method 2: web_search + web_fetch (FALLBACK)

If image_search is unavailable, use web_search to find photos on Unsplash or Pexels.
Construct queries: `"unsplash [subject] [style]"`. Fetch the image URL and embed.

### Method 3: CSS-only (LAST RESORT)

Only use when Methods 1 and 2 both fail or when the section genuinely works 
without imagery (CTA, footer, stats).

- Hero: atmospheric gradient + bold typography
- Features: SVG icons (16-24px) + text
- Stats: count-up animation, no photos needed

**NEVER use a gray placeholder rectangle.** If you can't get an image, design 
the section to work without one.

### SVG is for icons and data viz ONLY

Never use SVG for hero visuals, people, environments, product depictions, 
decorative illustrations, or anything that should be a photograph.

### Section Image Plan

Before generating HTML, plan every visual slot:

```
📸 IMAGE PLAN

| Section | Image Subject | Method | Query |
|---------|---------------|--------|-------|
| Hero | [specific scene] | image_search | [query] |
| Features | SVG icons | — | — |
| Social proof | none | — | — |
| CTA | CSS gradient | — | — |
```

---

## Step 8: Hi-Fi Mockup Generation

### Pre-generation checklist (STOP)

Before writing HTML, verify:
- [ ] Visual contract values loaded? (hex colors, fonts, layout)
- [ ] Hard layout constraints memorized? (re-read top of this file)
- [ ] Image plan complete?
- [ ] Surface type declared?
- [ ] Viewport declared?

### Content Strategy

Real content, not Lorem Ipsum. Domain-appropriate placeholders. Flag [draft].

**Copy budget defaults (consumer-style):**
- Headline: 2-6 words, hard max 8
- Support line: max 12 words, 1 only above fold
- No paragraphs in cards or heroes
- Use chips, badges, fact-rows before sentences
- One dominant CTA, one secondary max
- If section feels empty → fix with imagery/spacing, not more copy

### Website Hero and Branding

For marketing sites:
- Page-level hero, split-layout, or full-bleed — NOT a giant card
- Add provisional logo/wordmark in header
- If image-led: let image own real visual area, not a thumbnail

### Chinese Typography

If Chinese headline feels heavy: increase line-height, reduce bold glyph collision, 
split into intentional lines, add breathing room around the block.

### HTML Technical Requirements

```
- Single self-contained HTML
- Google Fonts / Bunny Fonts
- Visual contract colors and fonts (exact values from Gate 1)
- Interactive elements must work: tabs switch, toggles toggle, sliders slide
- Images via image_search URLs or CSS fallback (no gray rectangles)
- Annotations layer collapsed by default, toggled via floating button
- Dark mode toggle if applicable
```

### Layout Decision Table

| Content relationship | Use this | NOT this |
|---|---|---|
| One item dominates | Asymmetric (70/30) or full-width + stacked | Equal grid |
| Items genuinely equal (pricing) | Equal grid | Asymmetric |
| Sequential / narrative | Vertical stack | Side-by-side grid |
| Primary + sidebar | Main + aside (65-75% / 25-35%) | 50/50 |
| Single focus (form, article) | Single column, centered | Multi-column |

### Section Rhythm (scrollable pages, 3+ sections)

```
Hero: max impact, minimal text, 1 CTA
  ↓ 80-120px
Value prop / social proof: moderate density
  ↓ 64-80px
Features / details: higher density, grid OK
  ↓ 64-80px  
Trust / FAQ: reduce density
  ↓ 80-120px
Final CTA: mirror hero energy
```

### DS Compliance Check (after each mockup)

```
✅ DS CHECK: Colors ✓|✗ · Typography ✓|✗ · Spacing ✓|✗ · Radius ✓|✗
```

---

## Step 8.5: Micro-Interactions (MANDATORY for hi-fi)

Hi-fi mockups that don't move feel dead. Real products have subtle motion that 
communicates state, provides feedback, and creates delight. Every mockup MUST 
include at least 3 of the following interaction types, chosen by relevance to 
the design's content and purpose.

### Interaction Selection Rules

Pick interactions that serve the CONTENT, not the designer's ego:

| Content type | Required interactions | Why |
|---|---|---|
| Landing page / marketing | scroll-reveal + hover-CTA + parallax or counter | Build narrative as user scrolls |
| E-commerce / product | hover-card + image-zoom + add-to-cart feedback | Help user evaluate products |
| Dashboard / app | hover-row + tooltip + state-transition | Help user scan and act on data |
| Form / onboarding | focus-glow + validation-shake + progress-step | Reduce anxiety, show progress |
| Portfolio / showcase | scroll-reveal + image-hover + cursor-follow | Create premium feel |

### Micro-Interaction Library

Implement these with CSS only (no JS libraries). All must respect 
`prefers-reduced-motion: reduce`.

#### 1. Scroll reveal (fade-up on enter)
Sections appear as user scrolls. Stagger children for rhythm.
```css
.reveal { opacity: 0; transform: translateY(30px); transition: all 0.6s ease-out; }
.reveal.visible { opacity: 1; transform: translateY(0); }
/* JS: IntersectionObserver adds .visible when section enters viewport */
```
```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

#### 2. Hover CTA (scale + shadow lift)
Primary buttons feel pressable. Secondary buttons have subtle shift.
```css
.cta-primary { transition: transform 0.2s, box-shadow 0.2s; }
.cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.cta-primary:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
```

#### 3. Hover card (lift + border glow)
Cards lift toward user on hover, creating depth.
```css
.card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
.card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
```

#### 4. Counter animation (numbers count up)
Stats/KPIs animate from 0 to target value when visible.
```js
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1500;
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
// Trigger via IntersectionObserver when stat section enters viewport
```

#### 5. Smooth accordion / FAQ
Questions expand with height animation, icon rotates.
```css
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
.faq-item.open .faq-answer { max-height: 500px; }
.faq-icon { transition: transform 0.3s; }
.faq-item.open .faq-icon { transform: rotate(45deg); }
```

#### 6. Image hover (zoom + overlay)
Product/portfolio images zoom slightly, optional text overlay fades in.
```css
.img-hover { overflow: hidden; }
.img-hover img { transition: transform 0.4s ease; }
.img-hover:hover img { transform: scale(1.05); }
.img-hover .overlay { opacity: 0; transition: opacity 0.3s; }
.img-hover:hover .overlay { opacity: 1; }
```

#### 7. Nav scroll effect (shrink + shadow on scroll)
Sticky nav gets compact and gains shadow after scrolling past hero.
```css
.nav { transition: padding 0.3s, box-shadow 0.3s; }
.nav.scrolled { padding: 12px 0; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
```

#### 8. Tab / toggle transition
Content crossfades between states instead of instant swap.
```css
.tab-content { opacity: 0; transform: translateY(8px); transition: all 0.25s; position: absolute; }
.tab-content.active { opacity: 1; transform: translateY(0); position: relative; }
```

#### 9. Form focus glow
Input fields glow with accent color on focus, label floats up.
```css
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.15); }
.float-label { transition: all 0.2s; }
.input:focus + .float-label { transform: translateY(-24px) scale(0.85); color: var(--accent); }
```

#### 10. Parallax subtle (hero image depth)
Hero background moves at different speed from content. Keep it subtle.
```js
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero-bg');
  if (hero) hero.style.transform = `translateY(${window.scrollY * 0.3}px)`;
}, { passive: true });
```

### Motion Rules

- **Max 3-4 interaction types per page.** More = circus, less = dead.
- **All transitions 0.2–0.6s.** Under 0.2s feels abrupt. Over 0.6s feels sluggish.
- **Ease-out for entrances, ease-in for exits.** Not linear.
- **Respect `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { 
    animation-duration: 0.01ms !important; 
    transition-duration: 0.01ms !important; 
  }
}
```
- **Scroll-reveal once only.** Don't re-trigger on scroll up.
- **No animation on page load.** The hero should be visible immediately. 
  Scroll-reveal starts on sections BELOW the fold.

### Creative micro-interactions (add 1 per project for delight)

Beyond the functional interactions above, add ONE creative touch that 
connects to the product's identity:

- **Dental clinic:** Tooth icon in the favicon subtly "sparkles" on hover 
  over the logo. Or: appointment CTA has a gentle pulse like a heartbeat.
- **E-commerce:** Add-to-cart button shows a brief check animation + 
  cart badge bounces.
- **SaaS dashboard:** Toggle between views has a smooth morph transition. 
  Or: data cards "breathe" with a subtle scale pulse when data updates.
- **Restaurant:** Menu category pills have a food-emoji that bounces on select.
- **Portfolio:** Cursor leaves a subtle trail or projects have a tilt effect 
  that follows mouse position.

The creative interaction should feel inevitable — like "of course a dental 
site would do that." If it feels random, cut it.

```
📝 CHANGES
● [Changed]: [old] → [new] — [why]
○ [Kept]: [why]
◆ [New]: [why needed]
```

Flag adjacent screens that might have same issues.

---

## Step 10: Direction Failure → Retreat

- Visual wrong → redo Step 2 in Gate 3
- Structural wrong → retreat to Gate 2
- Context wrong → retreat to Gate 1

---

## Step 11: Interaction Spec

Skip if single static screen. Otherwise: markdown doc, build per-screen, 
complete with transitions after all screens done.

---

## Step 12: Iteration

- Text feedback → apply directly
- Directional ("too dense") → interpret, propose, confirm
- Comparative ("more like [ref]") → identify what to adopt
- Rejection → diagnose: layout? style? content? flow?

Track versions. Maintain DS compliance. Propagate cascading changes.

---

## Step 13: QA Checklist

Run before export:

```
QA CHECKLIST:
- Spacing: all from scale, consistent alignment
- Typography: defined families/sizes only
- Color: palette-only, WCAG AA contrast
- Components: identical across screens
- States: primary hi-fi'd, secondary in spec
- Interactive: all elements functional
- Layout: annotations hidden, hero ≤5 elements, no unjustified grids, 
  section gaps ≥64px, no 50/50 splits
- Bento test: count all grids, justify each one, fix or remove unjustified
- Images: no gray placeholders, hero has photo or strong typography,
  SVG for icons only, alt text on all images
- Visual contract: all values from Gate 1 contract used, no drift
- Micro-interactions: ≥3 interaction types present, prefers-reduced-motion 
  respected, no animation on initial page load, 1 creative delight touch

🔍 QA: ✅ [X] passed · ⚠️ [Y] warnings · ❌ [Z] failures
```

Fix failures before export.

---

## Step 14: Figma Export

"Ready to export. Full flow, key screens, or partial?"

Read `skills/design-lock/figma-schema-v0.2.md` for JSON schema.

---

## Step 15: Companion Documents

### DDR (Design Decision Record)
Context → Techniques Applied → Key Decisions (with gate + status) → 
Design Changes (ITERATE) → Design Debt → Open Items

### Handoff Summary
Screens, states, viewport, dark mode, DS, what to do in Figma, 
what NOT to change (LOCKED decisions).

---

## Step 16: Final Gate

Present outputs. "Confirm to export, or adjust?"

### Handoff Block

```
---DESIGN-LOCK---
schema: 2.0
flow_name: [name]
entry_path: G1-G2-G3|G1-G3
screens_exported: [N]
viewport: mobile|desktop|both
dark_mode: included|light-only
design_system: [name|ad-hoc|inferred]
visual_contract_enforced: true|false
qa_status: all-clear|warnings|fixed
iteration_rounds: [N]
companion_docs: DDR,interaction-spec,handoff-summary
---END-DESIGN-LOCK---
```

---

## Abort Protocol

Acknowledge → PARTIAL block → offer partial export → summarize re-entry path.

---

## Rules

1. **Hard layout constraints are law.** Re-read them before every HTML generation.
2. **Visual contract = exact CSS values.** Don't reinterpret, don't improve, don't drift.
3. **Images first, CSS-only last.** Always try image_search before falling back.
4. **No gray rectangles.** Ever. Design without image (Route C) instead.
5. **Realistic content.** No Lorem Ipsum.
6. **Surface type = composition rules.** Website ≠ app ≠ dashboard.
7. **Sans-serif default.** Serif only when explicitly requested.
8. **Asymmetry is confidence.** Every screen needs a clear visual winner.
9. **One screen at a time.** Show → iterate → move on.
10. **All interactive elements work.** Toggle toggles, slider slides.

---

## Anti-Patterns (top 10)

1. **Bento box:** Equal-weight grid with no hierarchy. The #1 failure mode.
2. **50/50 split hero:** The most common AI layout default. Always generic.
3. **Annotation contamination:** Design rationale visible in the mockup.
4. **Viewport stuffing:** Everything above the fold. Real products scroll.
5. **Gray placeholder:** Never. CSS-only is intentional; gray box is lazy.
6. **Surface mismatch:** Marketing site rendered as app, or vice versa.
7. **Collage hero:** Full-bleed + overlay + cards + panels + badges. Pick ONE.
8. **Visual contract drift:** Reference site was black/white/blue, output is purple.
9. **Generic stock photo:** "Happy people" when section discusses dental procedures.
10. **Lorem Ipsum in hi-fi:** Credibility destroyer.
