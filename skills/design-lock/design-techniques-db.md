# Design Techniques Database

Use this file during Gate 3 before committing to a visual treatment.
This is a pattern library, not a style-copying catalog. Borrow the mechanism,
not the skin. The job is to match the user's problem to the right technique
cluster, then adapt it to the current product, constraints, and design system.

## Retrieval Rules

### Step 1: Extract context

From the user prompt and upstream handoff blocks, answer these questions:
- What is the screen's primary purpose?
- What is the user's primary task on this screen?
- What platform/viewport is this for?
- What tone does the product need?

### Step 2: Match screen-level technique (pick 1-2)

Walk the decision tree. At each node, pick the branch that best fits the screen:

```text
Is the screen primarily about DATA CONSUMPTION (viewing, scanning, monitoring)?
├─ Yes → Is it an overview/summary or a record-level/table view?
│   ├─ Overview/summary → #7 Dashboard Scanability
│   └─ Record-level/table → #8 Dense Data Clarification
│
└─ No → Is it primarily about DATA INPUT (forms, configuration, editing)?
    ├─ Yes → Does the input involve money, commitment, or irreversible action?
    │   ├─ Yes → #6 Checkout and Commitment Reassurance
    │   └─ No → Is the configuration risky or destructive?
    │       ├─ Yes → #10 Settings and Safety
    │       └─ No → #5 Form Friction Reduction
    │
    └─ No → Is it about FINDING or BROWSING content?
        ├─ Yes → #9 Search and Discovery
        │
        └─ No → Is it a FIRST-TIME or ONBOARDING experience?
            ├─ Yes → #1 Activation Onboarding
            │
            └─ No → Is it a MARKETING or CONVERSION page?
                ├─ Yes → Does it compare plans, tiers, or options?
                │   ├─ Yes → #3 Pricing and Plan Comparison
                │   └─ No → #2 Landing Conversion
                │
                └─ No → Is it MULTI-USER COORDINATION?
                    ├─ Yes → #15 Collaborative Workflow
                    │
                    └─ No → Does it involve AI-GENERATED content or assistance?
                        ├─ Yes → #16 AI Copilot and Generative Guidance
                        │
                        └─ No → Is this a MOBILE APP (product_surface = mobile-app)?
                            ├─ Yes → #13 Mobile App Design (ALWAYS as base layer)
                            │         Then overlay screen-level technique:
                            │         ├─ Feed/list screen → #13 + #9 Search and Discovery
                            │         ├─ Settings screen → #13 + #10 Settings and Safety
                            │         ├─ Onboarding flow → #13 + #1 Activation Onboarding
                            │         ├─ Checkout/payment → #13 + #6 Checkout Reassurance
                            │         ├─ Dashboard/stats → #13 + #7 Dashboard Scanability
                            │         └─ Other → #13 alone
                            └─ No → Is the primary viewport MOBILE (responsive web)?
                                ├─ Yes → #13 Mobile Focus (web variant)
                                └─ No → Use fallback (see below)
```

If two branches seem equally valid, pick both (max 2 screen-level techniques).

### Step 3: Check tone modifiers (pick 0-1)

- Does the user need to overcome trust, doubt, or hesitation? → Add #4 Trust and Credibility Lift
- Does the product need premium restraint, calm, or editorial sophistication? → Add #14 Premium Calm
- Neither? → No tone modifier.

### Step 4: Check state-level patterns (pick 0-2)

- Does this screen have a zero-content or first-time state? → Add #11 Empty State Guidance
- Does this screen have error, failure, or blocked states? → Add #12 Error Recovery and Resilience

### Step 5: Conflict resolution

If matched techniques conflict, apply this priority:
1. Task clarity over visual novelty
2. Error prevention over cleverness
3. Scanability over density

### Fallback

If no branch in the decision tree fits well, apply these defaults:
- Clear visual hierarchy
- Content chunking
- Progressive disclosure
- One clear primary action

### Required Output

After matching, emit:

```md
🎯 TECHNIQUE MATCH

Decision path: [the tree path taken, e.g. "Data consumption → Overview → #7"]

Screen-level: [matched cluster name(s)]
Tone modifier: [matched or "none"]
State patterns: [matched or "none"]

Techniques to apply:
- [specific techniques from the matched clusters' Apply sections]

Techniques intentionally excluded:
- [what you're NOT using and why]
```

Then propagate the chosen techniques into:
- HTML mockup structure (use Visual Execution specs)
- Interaction Spec
- DDR
- JSON `metadata.technique_clusters`
- JSON `metadata.decisions_applied`

## Screen-Level Techniques

### About Visual Execution specs

Each screen-level technique includes a `Visual Execution` block. This block translates the technique's UX principles into concrete CSS-level layout constraints. When generating HTML mockups in Gate 3, treat these specs as binding layout constraints — deviate only if the design system conflicts, and flag the deviation.

Format:
- **Layout:** CSS layout pattern — grid columns, flex direction, section order
- **Spacing:** gap between major sections / internal padding / section breaks in px
- **Typography weight:** hierarchy — what's biggest/boldest, what's smallest, size ratios
- **Color distribution:** % neutral vs accent, where accent appears, what triggers color
- **Component density:** cards per row, items visible before scroll, action placement
- **Key CSS pattern:** one concrete CSS snippet (10-15 lines) showing the core structural pattern

### 1. Activation Onboarding

**Keywords:** onboarding, first-time, activation, setup, checklist, welcome, new user, empty start

**Use when:** the user must reach first value quickly and the design needs momentum.

**Apply:**
- Show one clear next step above secondary education
- Use checklist or progressive milestones to reduce ambiguity
- Pair reassurance copy with visible progress
- Reveal advanced choices later, not on step one

**Avoid when:** expert repeat users need dense control immediately.

**Steal the mechanism, not the skin:** guided sequencing, not mascot-heavy onboarding.

#### Visual Execution

- **Layout:** Single column, centered, `max-width: 600px`. Progress indicator top. Steps stacked vertically, one visible at a time or as a scrollable checklist.
- **Spacing:** 32px between steps. 24px internal padding per step card. 48px from progress bar to first step.
- **Typography weight:** Step title 600/20px. Step description 400/15px. Progress label 500/13px uppercase tracking 0.05em.
- **Color distribution:** 95% neutral. Primary accent only on: current step indicator, primary CTA, completed checkmarks.
- **Component density:** One step dominates viewport. Secondary actions (skip, learn more) are text links below primary CTA.
- **Key CSS pattern:**
  ```css
  .onboarding { max-width: 600px; margin: 0 auto; padding: 48px 24px; }
  .progress { display: flex; gap: 8px; margin-bottom: 48px; }
  .progress-step { flex: 1; height: 4px; border-radius: 2px; background: var(--neutral-200); }
  .progress-step.done { background: var(--primary); }
  .step-card { padding: 24px; margin-bottom: 32px; }
  .step-title { font-weight: 600; font-size: 20px; margin-bottom: 8px; }
  .step-cta { width: 100%; padding: 14px; font-weight: 600; margin-top: 24px; }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Step imagery:** If a step benefits from a visual, use contextual
  photography or device/product mockups tied to the step outcome. Route C
  fallback: icon + headline + progress, no scene illustration.
- **Entrance animation:** Steps fade-up with stagger (0.1s delay per step).
  Completed steps slide left as next appears.
- **Progress animation:** Progress bar fills with eased transition (0.3s)
  on each step completion.
- **Avoid:** Atmospheric backgrounds, decorative accents, and generic lifestyle
  photos. Keep focus on the task. Onboarding is functional, not decorative.

### 2. Landing Conversion

**Keywords:** landing, hero, CTA, conversion, campaign, marketing, homepage, sign up

**Use when:** the page must explain value fast and move users into one primary action.

**Apply:**
- Make the value proposition legible in 3 seconds
- Keep one dominant CTA and one secondary path at most
- Use social proof near the decision point, not buried below
- Structure sections as claim -> proof -> action

**Avoid when:** the page is primarily navigational or documentation-driven.

**Steal the mechanism, not the skin:** narrative sequencing, not somebody else's gradients and art direction.

#### Visual Execution

- **Layout:** Full-width sections stacked vertically. Hero section `min-height: 70vh` with centered content. Sections alternate between full-bleed and `max-width: 1200px` contained.
- **Spacing:** 80-120px between major sections. 24px between heading and subheading. 16px between subheading and CTA. Social proof within 24px of CTA.
- **Typography weight:** Hero H1 700/48-64px. Subheading 400/20-24px. Section headers 600/32-40px. Body 400/16-18px. Extreme contrast ratio between H1 and body (3:1 minimum size ratio).
- **Color distribution:** Hero uses strong contrast (dark bg + light text or light bg + bold accent CTA). Section backgrounds alternate subtle neutrals. Accent color reserved for CTA buttons only.
- **Component density:** One CTA dominates hero. Max 2 CTAs visible at any time (primary + secondary ghost). Feature sections: 3-4 items per row on desktop, stacked on mobile.
- **Key CSS pattern:**
  ```css
  .hero { min-height: 70vh; display: flex; align-items: center; justify-content: center; text-align: center; }
  .hero h1 { font-size: clamp(36px, 5vw, 64px); font-weight: 700; margin-bottom: 24px; }
  .hero .subtitle { font-size: 20px; opacity: 0.8; margin-bottom: 16px; max-width: 600px; }
  .hero .cta-primary { padding: 16px 48px; font-size: 18px; font-weight: 600; }
  .social-proof { margin-top: 24px; display: flex; align-items: center; gap: 12px; justify-content: center; }
  section { padding: 80px 24px; }
  .section-inner { max-width: 1200px; margin: 0 auto; }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Hero photography:** Full-width contextual photo showing the product's
  value in action. This is the single most important visual on the page.
- **Atmospheric background:** Hero section uses a subtle gradient or radial
  glow matching the brand palette. Transition to neutral for content sections.
- **Social proof:** Logo row as inline SVG (simplified, monochrome versions
  of recognizable shapes — not text, not image placeholders).
- **Entrance animations:** Hero content fades up on load (H1 first, subtitle
  0.1s later, CTA 0.2s later). Below-fold sections fade up on scroll with
  IntersectionObserver.
- **Number count-up:** If showing stats ("10,000+ users"), animate from 0 on
  scroll-into-view.
- **Go all in.** Every major section should have either contextual photography
  (Route A/B) or a strong typographic + atmospheric treatment (Route C).
- **Avoid:** Generic "happy people" stock and abstract vector scenes that do
  not match the page claim.

### 3. Pricing and Plan Comparison

**Keywords:** pricing, plan, compare, upgrade, subscription, tiers, enterprise quote

**Use when:** users need to compare options with low cognitive effort.

**Apply:**
- Align features in a strict comparison grid
- Highlight the recommended plan with contrast and rationale
- Separate "core differentiators" from long-tail details
- Keep FAQs and objections adjacent to pricing, not on another page

**Avoid when:** there is only one real plan and comparison UI creates fake complexity.

**Steal the mechanism, not the skin:** decision scaffolding, not a cloned 3-card layout.

#### Visual Execution

- **Layout:** CSS Grid, equal-width columns (2-4 based on plan count). Recommended plan visually elevated. Feature comparison rows aligned strictly.
- **Spacing:** 24px gap between plan columns. 0 gap between feature rows (use border separation). 48px between pricing header and feature grid. 32px between feature grid and FAQ.
- **Typography weight:** Plan name 600/18px. Price 700/36-48px. Price period 400/14px. Feature text 400/14px. Category headers in feature grid 600/13px uppercase.
- **Color distribution:** Recommended plan: primary border-top 4px + subtle primary bg tint (opacity 0.05) + "Recommended" badge in primary color. Other plans: neutral border. Feature checkmarks in green, missing in neutral-300.
- **Component density:** All plans visible without scroll on desktop. Feature rows compact (40px height). Expand/collapse for long feature lists. CTA per plan at bottom of each column, sticky on scroll if columns are tall.
- **Key CSS pattern:**
  ```css
  .pricing-grid { display: grid; grid-template-columns: repeat(var(--plan-count, 3), 1fr); gap: 24px; max-width: 1100px; margin: 0 auto; }
  .plan-card { border: 1px solid var(--neutral-200); border-radius: 12px; padding: 32px 24px; position: relative; }
  .plan-card.recommended { border-color: var(--primary); border-top-width: 4px; background: color-mix(in srgb, var(--primary) 5%, white); transform: scale(1.03); }
  .plan-price { font-size: 42px; font-weight: 700; }
  .plan-price span { font-size: 14px; font-weight: 400; color: var(--neutral-500); }
  .feature-row { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--neutral-100); font-size: 14px; }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Pricing stays clarity-first:** The comparison grid should usually remain
  Route C. If supporting imagery is needed, keep it outside the comparison
  columns as a narrow contextual photo, never inside the pricing cards.
- **Column entrance:** Plans stagger in from bottom (0.1s delay each).
  Recommended plan enters last with a slight scale-up (1.0 → 1.03).
- **CTA pulse:** Primary CTA on recommended plan gets a subtle pulse glow
  animation. Other plans' CTAs are static.
- **Toggle animation:** Monthly/annual toggle slides with smooth transition.
  Price numbers animate between values (count-up/down).
- **Avoid:** Hero photography in the grid, illustration scenes, and decorative
  accents. Pricing pages are about clarity. Visual noise undermines comparison.

#### Reference Snippet

```html
<style>
  :root {
    --primary: #2563eb;
    --neutral-50: #f8fafc;
    --neutral-100: #e2e8f0;
    --neutral-200: #cbd5e1;
    --neutral-500: #64748b;
    --neutral-900: #0f172a;
    --success: #16a34a;
  }
  .pricing-demo { max-width: 1100px; margin: 0 auto; padding: 40px 24px; font-family: Inter, sans-serif; color: var(--neutral-900); }
  .pricing-demo h2 { margin: 0 0 12px; font-size: 36px; }
  .pricing-demo p { margin: 0 0 40px; color: var(--neutral-500); font-size: 16px; }
  .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .plan-card { border: 1px solid var(--neutral-200); border-radius: 16px; padding: 28px 24px; background: white; }
  .plan-card.recommended { border-top: 4px solid var(--primary); background: color-mix(in srgb, var(--primary) 5%, white); transform: scale(1.02); }
  .badge { display: inline-block; margin-bottom: 16px; padding: 6px 10px; border-radius: 999px; background: color-mix(in srgb, var(--primary) 12%, white); color: var(--primary); font-size: 12px; font-weight: 600; }
  .plan-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
  .plan-price { font-size: 44px; font-weight: 700; margin-bottom: 4px; }
  .plan-period { color: var(--neutral-500); font-size: 14px; margin-bottom: 24px; }
  .feature-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--neutral-100); font-size: 14px; }
  .feature-status { color: var(--success); font-weight: 600; }
  .cta { width: 100%; margin-top: 24px; padding: 14px; border: 0; border-radius: 10px; background: var(--primary); color: white; font-weight: 600; }
</style>

<section class="pricing-demo">
  <!-- component: pricing-header -->
  <h2>Choose the workspace that fits your team</h2>
  <p>Start free, upgrade when collaboration and reporting need more structure.</p>

  <!-- component: pricing-grid -->
  <div class="pricing-grid">
    <!-- component: pricing-plan -->
    <article class="plan-card">
      <div class="plan-name">Starter</div>
      <div class="plan-price">$0</div>
      <div class="plan-period">per editor / month</div>
      <div class="feature-row"><span>3 active projects</span><span class="feature-status">Included</span></div>
      <div class="feature-row"><span>Basic client review</span><span class="feature-status">Included</span></div>
      <div class="feature-row"><span>Export watermark</span><span>Yes</span></div>
      <button class="cta">Start free</button>
    </article>

    <!-- component: pricing-plan -->
    <article class="plan-card recommended">
      <div class="badge">Recommended</div>
      <div class="plan-name">Studio</div>
      <div class="plan-price">$29</div>
      <div class="plan-period">per editor / month</div>
      <div class="feature-row"><span>Unlimited projects</span><span class="feature-status">Included</span></div>
      <div class="feature-row"><span>Approval workflows</span><span class="feature-status">Included</span></div>
      <div class="feature-row"><span>Weekly performance digest</span><span class="feature-status">Included</span></div>
      <button class="cta">Upgrade to Studio</button>
    </article>

    <!-- component: pricing-plan -->
    <article class="plan-card">
      <div class="plan-name">Enterprise</div>
      <div class="plan-price">Custom</div>
      <div class="plan-period">annual contract</div>
      <div class="feature-row"><span>SSO and SCIM</span><span class="feature-status">Included</span></div>
      <div class="feature-row"><span>Audit logs</span><span class="feature-status">Included</span></div>
      <div class="feature-row"><span>Dedicated onboarding</span><span class="feature-status">Included</span></div>
      <button class="cta">Talk to sales</button>
    </article>
  </div>
</section>
```

### 5. Form Friction Reduction

**Keywords:** form, signup, application, input, fields, completion, friction, autofill

**Use when:** users must enter data and drop-off risk is high.

**Apply:**
- Break long forms into logical chunks
- Use progressive disclosure for optional or advanced fields
- Prefer inline validation and helpful defaults
- Add context so users know why information is requested

**Avoid when:** users need simultaneous visibility across many related fields.

**Steal the mechanism, not the skin:** lower perceived effort, not fancy input styling.

#### Visual Execution

- **Layout:** Single column, `max-width: 480px`, centered. Fields grouped in fieldsets with group labels. Progress indicator at top if multi-step.
- **Spacing:** 16px between fields within a group. 32px between field groups. 24px padding inside fieldset. 48px from last group to submit button.
- **Typography weight:** Group label 600/16px. Field label 500/14px. Input text 400/16px. Helper text 400/13px in neutral-500. Error text 500/13px in red.
- **Color distribution:** 98% neutral. Primary color only on: focused field border, submit button, progress indicator. Red for errors only. Green for success validation only. No decorative color.
- **Component density:** Max 5-6 visible fields before scroll. Optional fields hidden behind "Show more" or in a later step. Submit button full-width, 48px height minimum.
- **Key CSS pattern:**
  ```css
  .form-container { max-width: 480px; margin: 0 auto; padding: 32px 24px; }
  .field-group { margin-bottom: 32px; }
  .field-group-label { font-weight: 600; font-size: 16px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--neutral-200); }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-weight: 500; font-size: 14px; margin-bottom: 6px; }
  .field input { width: 100%; padding: 12px; border: 1px solid var(--neutral-300); border-radius: 8px; font-size: 16px; }
  .field input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent); }
  .submit-btn { width: 100%; padding: 14px; font-weight: 600; margin-top: 48px; }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Form intro visual:** If the surrounding page needs imagery, keep it
  outside the form area as a contextual photo or product shot. Route C
  fallback: typography + progress only.
- **Field entrance:** Fields in each group fade up with stagger as the user
  reaches that group (scroll-triggered) or when a multi-step form advances.
- **Validation animation:** Success checkmark scales in (0 → 1) with spring
  ease. Error shake uses `translateX(-4px, 4px, 0)` over 0.3s.
- **Progress indicator:** Top progress bar or step dots animate fill/color
  on advancement.
- **Avoid:** Photography in the form body, atmospheric backgrounds that reduce
  readability, and decorative accents. The form is the design.

### 6. Checkout and Commitment Reassurance

**Keywords:** checkout, payment, purchase, cart, booking, confirm, order summary

**Use when:** users are close to committing money, time, or personal information.

**Apply:**
- Keep a persistent summary of what they are committing to
- Surface fees, timing, and policy details before the final click
- Reduce surprise by making the final action label explicit
- Keep escape hatches visible but low emphasis

**Avoid when:** the flow is exploratory and commitment is still low.

**Steal the mechanism, not the skin:** anxiety reduction, not generic ecommerce chrome.

#### Visual Execution

- **Layout:** Two-column on desktop: form area 60% left, order summary 40% right sticky. Single-column stacked on mobile with summary collapsible at top.
- **Spacing:** 32px gap between columns. 24px between form sections. 16px between summary line items. 24px padding inside summary panel. Divider line before total.
- **Typography weight:** Section headers 600/18px. Field labels 500/14px. Summary item names 400/14px. Summary item prices 500/14px right-aligned. Total label 600/16px. Total price 700/24px.
- **Color distribution:** Summary panel uses subtle bg (neutral-50 or neutral-100) + 1px border. Primary accent only on submit/pay button. Trust badges in neutral-500 with small icons. No alert colors unless error.
- **Component density:** Summary always visible on desktop. Line items compact (no cards). Fees/tax/shipping shown before total, never hidden. Trust badges (security, refund policy) inline within 24px of submit button.
- **Key CSS pattern:**
  ```css
  .checkout { display: grid; grid-template-columns: 1fr 400px; gap: 32px; max-width: 1100px; margin: 0 auto; }
  .checkout-form section { margin-bottom: 24px; }
  .order-summary { position: sticky; top: 24px; background: var(--neutral-50); border: 1px solid var(--neutral-200); border-radius: 12px; padding: 24px; align-self: start; }
  .summary-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .summary-total { display: flex; justify-content: space-between; padding-top: 16px; margin-top: 16px; border-top: 2px solid var(--neutral-300); }
  .summary-total .price { font-size: 24px; font-weight: 700; }
  .trust-badges { display: flex; gap: 16px; margin-top: 16px; font-size: 12px; color: var(--neutral-500); }
  @media (max-width: 768px) { .checkout { grid-template-columns: 1fr; } }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Commitment summary image:** If the order references a physical product,
  service location, or booking context, use a small thumbnail that matches the
  actual item or context. Otherwise omit imagery.
- **Trust badge SVGs:** Lock icon, shield icon, guarantee badge as small
  (24x24) inline SVGs near the submit button. Simple line-art style, same
  stroke weight, using neutral-500 color.
- **Total count-up:** Order total animates when line items change (add/remove).
  Duration 0.3s, ease-out.
- **Submit button glow:** Subtle pulse on the pay/submit button ONLY after
  all required fields are valid. Draws attention to the ready state.
- **Avoid:** Hero photography, decorative accents, and atmospheric backgrounds.
  Checkout is the highest-trust moment — visual restraint IS the trust signal.

#### Reference Snippet

```html
<style>
  :root {
    --primary: #0f766e;
    --neutral-50: #f8fafc;
    --neutral-100: #e2e8f0;
    --neutral-200: #cbd5e1;
    --neutral-500: #64748b;
    --neutral-900: #0f172a;
  }
  .summary-demo { max-width: 420px; margin: 0 auto; padding: 40px 24px; font-family: Inter, sans-serif; color: var(--neutral-900); }
  .order-summary { position: sticky; top: 24px; border: 1px solid var(--neutral-200); border-radius: 16px; background: var(--neutral-50); padding: 24px; }
  .summary-title { margin: 0 0 20px; font-size: 18px; font-weight: 600; }
  .summary-item { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; font-size: 14px; }
  .summary-item small { display: block; margin-top: 4px; color: var(--neutral-500); font-size: 12px; }
  .summary-divider { margin: 16px 0; border-top: 1px solid var(--neutral-200); }
  .summary-total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 8px; }
  .summary-total .label { font-size: 16px; font-weight: 600; }
  .summary-total .price { font-size: 28px; font-weight: 700; }
  .cta { width: 100%; margin-top: 20px; padding: 14px; border: 0; border-radius: 12px; background: var(--primary); color: white; font-size: 16px; font-weight: 600; }
  .trust-badges { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; color: var(--neutral-500); font-size: 12px; }
  .trust-badge { display: inline-flex; align-items: center; gap: 6px; }
</style>

<aside class="summary-demo">
  <!-- component: order-summary -->
  <section class="order-summary">
    <h3 class="summary-title">Order summary</h3>

    <!-- component: summary-line-item -->
    <div class="summary-item">
      <div>
        Pro annual workspace
        <small>12 editors, billed yearly</small>
      </div>
      <strong>$2,880</strong>
    </div>

    <!-- component: summary-line-item -->
    <div class="summary-item">
      <div>
        Priority migration
        <small>One-time setup support</small>
      </div>
      <strong>$400</strong>
    </div>

    <!-- component: summary-line-item -->
    <div class="summary-item">
      <span>Subtotal</span>
      <strong>$3,280</strong>
    </div>
    <div class="summary-item">
      <span>Tax</span>
      <strong>$262.40</strong>
    </div>

    <div class="summary-divider"></div>

    <!-- component: summary-total -->
    <div class="summary-total">
      <span class="label">Total due today</span>
      <span class="price">$3,542.40</span>
    </div>

    <!-- component: primary-cta -->
    <button class="cta">Pay and activate workspace</button>

    <!-- component: trust-badges -->
    <div class="trust-badges">
      <span class="trust-badge">Lock PCI-secured payment</span>
      <span class="trust-badge">Refund 30-day refund policy</span>
      <span class="trust-badge">Invoice delivered instantly</span>
    </div>
  </section>
</aside>
```

### 7. Dashboard Scanability

**Keywords:** dashboard, analytics, KPI, overview, workspace, monitor, reporting

**Use when:** users need to scan, orient, and spot anomalies quickly.

**Apply:**
- Organize by priority: summary -> trend -> detail -> action
- Use contrast and spacing to create scanning lanes
- Keep filters close to the content they change
- Reserve strong color for exceptions, not everything

**Avoid when:** the real task is deep record editing, not overview scanning.

**Steal the mechanism, not the skin:** scan-first layout, not trendy glass cards.

#### Visual Execution

- **Layout:** CSS Grid 12-column. KPI summary cards top row (span 3 each, 4 cards). Chart area middle row (span 6 each, 2 charts). Data table full-width bottom row. Optional filter bar above charts.
- **Spacing:** 24px grid gap. 20px internal padding per card. 32px between major sections (KPI row -> charts -> table). 16px between filter bar and content.
- **Typography weight:** KPI number 600/28-32px. KPI label 400/12px uppercase tracking 0.05em. KPI delta 500/13px. Chart title 600/14px. Table header 600/12px uppercase. Table body 400/13px.
- **Color distribution:** 90% neutral (grays, white cards). Accent color ONLY on: positive/negative delta indicators (green/red), chart data series, selected filter state. No decorative accent on cards or section backgrounds.
- **Component density:** 4 KPI cards visible without scroll. Charts show max 2 side by side. Table shows 8-10 rows before scroll. Filter bar uses pills/chips, not dropdowns.
- **Key CSS pattern:**
  ```css
  .dashboard { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; padding: 24px; }
  .kpi-card { grid-column: span 3; background: white; border: 1px solid var(--neutral-200); border-radius: 12px; padding: 20px; }
  .kpi-value { font-size: 30px; font-weight: 600; }
  .kpi-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--neutral-500); margin-bottom: 4px; }
  .kpi-delta { font-size: 13px; font-weight: 500; }
  .kpi-delta.up { color: var(--green-600); }
  .kpi-delta.down { color: var(--red-600); }
  .chart-panel { grid-column: span 6; background: white; border: 1px solid var(--neutral-200); border-radius: 12px; padding: 20px; }
  .data-table { grid-column: 1 / -1; }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Data stays primary:** Use product UI, charts, and metrics as the visual.
  If surrounding marketing chrome needs imagery, keep it outside the data canvas.
- **SVG sparklines:** Each KPI card gets a tiny (100x30) inline SVG sparkline
  showing trend. Use `<polyline>` with 10-15 data points. Stroke color matches
  the delta direction (green for up, red for down, neutral for flat).
- **Number count-up:** KPI values animate from 0 on page load. Duration 1s,
  ease-out. Stagger by card (0.15s delay each).
- **Dot grid background:** Main dashboard area uses a subtle dot-grid pattern
  (24px spacing, 1px dots at neutral-300).
- **Chart animations:** If charts are included, bars grow from 0 height,
  lines draw from left to right using SVG stroke-dashoffset animation.
- **Avoid:** Hero photos, lifestyle photography, floating accents, and
  atmospheric gradients. Dashboards are information displays, not marketing pages.

#### Reference Snippet

```html
<style>
  :root {
    --primary: #2563eb;
    --neutral-0: #ffffff;
    --neutral-100: #e2e8f0;
    --neutral-200: #cbd5e1;
    --neutral-500: #64748b;
    --neutral-900: #0f172a;
    --green-600: #16a34a;
    --red-600: #dc2626;
  }
  .dashboard-demo { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; padding: 32px 24px; font-family: Inter, sans-serif; color: var(--neutral-900); background: #f8fafc; }
  .kpi-card { grid-column: span 3; background: var(--neutral-0); border: 1px solid var(--neutral-200); border-radius: 16px; padding: 20px; }
  .kpi-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--neutral-500); margin-bottom: 8px; }
  .kpi-value { font-size: 30px; font-weight: 600; margin-bottom: 6px; }
  .kpi-delta { font-size: 13px; font-weight: 500; }
  .up { color: var(--green-600); }
  .down { color: var(--red-600); }
  .chart-panel { grid-column: span 6; background: var(--neutral-0); border: 1px solid var(--neutral-200); border-radius: 16px; padding: 20px; }
  .chart-title { margin: 0 0 18px; font-size: 14px; font-weight: 600; }
  .chart-bars { display: flex; align-items: end; gap: 14px; height: 180px; }
  .bar { flex: 1; border-radius: 10px 10px 0 0; background: color-mix(in srgb, var(--primary) 18%, white); position: relative; }
  .bar.active { background: var(--primary); }
  .bar span { position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%); font-size: 12px; color: var(--neutral-500); }
</style>

<section class="dashboard-demo">
  <!-- component: kpi-card-row -->
  <article class="kpi-card">
    <div class="kpi-label">Weekly revenue</div>
    <div class="kpi-value">$184K</div>
    <div class="kpi-delta up">+12.4% vs last week</div>
  </article>
  <article class="kpi-card">
    <div class="kpi-label">Active trials</div>
    <div class="kpi-value">1,248</div>
    <div class="kpi-delta up">+86 net new</div>
  </article>
  <article class="kpi-card">
    <div class="kpi-label">Churn risk</div>
    <div class="kpi-value">4.8%</div>
    <div class="kpi-delta down">-0.6 pts improved</div>
  </article>
  <article class="kpi-card">
    <div class="kpi-label">Avg. approval time</div>
    <div class="kpi-value">9.2h</div>
    <div class="kpi-delta up">32% faster</div>
  </article>

  <!-- component: chart-panel -->
  <section class="chart-panel">
    <h3 class="chart-title">Conversion trend</h3>
    <div class="chart-bars">
      <div class="bar" style="height: 48%;"><span>Mon</span></div>
      <div class="bar" style="height: 56%;"><span>Tue</span></div>
      <div class="bar" style="height: 52%;"><span>Wed</span></div>
      <div class="bar active" style="height: 74%;"><span>Thu</span></div>
      <div class="bar" style="height: 61%;"><span>Fri</span></div>
      <div class="bar" style="height: 44%;"><span>Sat</span></div>
      <div class="bar" style="height: 58%;"><span>Sun</span></div>
    </div>
  </section>
</section>
```

### 8. Dense Data Clarification

**Keywords:** dense, table, data-heavy, admin, records, compare rows, columns, operations

**Use when:** the interface must hold a lot of information without collapsing usability.

**Apply:**
- Use grouping, sticky headers, and row states to maintain orientation
- Increase type contrast before increasing color
- Let bulk actions stay dormant until selection exists
- Separate destructive actions from high-frequency actions

**Avoid when:** the user is novice and the better solution is simplification.

**Steal the mechanism, not the skin:** operational clarity, not spreadsheet cosplay.

#### Visual Execution

- **Layout:** Full-width table with `table-layout: fixed`. Optional sidebar filters on desktop (240px). Toolbar above table with search + bulk actions. Bulk action bar appears at bottom only when rows are selected.
- **Spacing:** Table rows 44px height. Cell padding 12px horizontal, 0 vertical (vertically centered). 16px gap between toolbar and table. 0 gap between rows (use borders).
- **Typography weight:** Column header 600/12px uppercase tracking 0.04em. Cell text 400/13px. Selected row count in bulk bar 600/13px. Action buttons 500/13px.
- **Color distribution:** Alternating row backgrounds with 0.03 opacity tint. Selected rows with primary tint (opacity 0.08). Header row neutral-50 bg. Destructive actions in red, separated from regular actions. No decorative color.
- **Component density:** Show 15-20 rows before scroll. Columns: prioritize 5-7 visible, rest in horizontal scroll or column toggle. Actions column right-aligned, icon-only for space.
- **Key CSS pattern:**
  ```css
  .data-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 13px; }
  .data-table th { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 12px; background: var(--neutral-50); border-bottom: 2px solid var(--neutral-200); text-align: left; position: sticky; top: 0; }
  .data-table td { padding: 12px; border-bottom: 1px solid var(--neutral-100); height: 44px; vertical-align: middle; }
  .data-table tr:nth-child(even) { background: rgba(0,0,0,0.015); }
  .data-table tr.selected { background: color-mix(in srgb, var(--primary) 8%, white); }
  .bulk-bar { position: sticky; bottom: 0; background: var(--neutral-900); color: white; padding: 12px 24px; display: none; }
  .bulk-bar.active { display: flex; align-items: center; justify-content: space-between; }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Minimal.** Dense data screens are already visually complex. Route C is the
  default. Use only data cues, icons, and essential state transitions.
- **Allowed:** Row selection highlight transition (0.15s bg-color change),
  bulk action bar slide-up entrance, sort indicator rotation.
- **Avoid everything else.** No photography, no atmospheric backgrounds,
  no decorative accents, and no entrance animations on data rows. They load
  instantly — users need to scan, not wait.

### 9. Search and Discovery

**Keywords:** search, discover, browse, filter, find, results, catalog, listing

**Use when:** the user does not know exactly where the target item lives.

**Apply:**
- Put the strongest filter axis first
- Show result count and active filters clearly
- Use empty and zero-result states as refinement guidance
- Support quick scanning with strong item summaries

**Avoid when:** there are too few items to justify heavy search UI.

**Steal the mechanism, not the skin:** findability, not overbuilt filter panels.

#### Visual Execution

- **Layout:** Search bar prominent top center (`min-height: 48px`, `max-width: 720px`). Desktop: filter sidebar 240px fixed left + results area right. Mobile: filters in bottom sheet/modal. Results as list or grid (toggleable).
- **Spacing:** 24px between search bar and results area. 16px between filter groups in sidebar. 16px gap between result items. 12px internal padding per result card.
- **Typography weight:** Search input 400/16px. Active filter count badge 600/12px. Result title 600/15px. Result meta 400/13px neutral-500. Filter group label 600/13px uppercase.
- **Color distribution:** Active filters use primary pill bg (opacity 0.1) + primary text. Result cards neutral with hover border or shadow lift. Zero-result state uses neutral-400 icon treatment + primary CTA.
- **Component density:** Result count + active filter pills shown above results. 10-12 results visible before scroll (list) or 8-12 (grid). Filter sidebar scrolls independently.
- **Key CSS pattern:**
  ```css
  .search-bar { max-width: 720px; margin: 0 auto 24px; position: relative; }
  .search-bar input { width: 100%; padding: 14px 48px 14px 16px; font-size: 16px; border: 2px solid var(--neutral-200); border-radius: 12px; }
  .search-bar input:focus { border-color: var(--primary); }
  .search-layout { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }
  .filter-sidebar { position: sticky; top: 24px; align-self: start; }
  .filter-group { margin-bottom: 16px; }
  .filter-group-label { font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
  .result-card { padding: 12px; border: 1px solid var(--neutral-200); border-radius: 8px; transition: box-shadow 0.15s; }
  .result-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Result imagery:** If results are catalog-like, use real thumbnails or
  contextual photos on the cards. Zero-result states fall back to a small icon
  plus guidance text, not a scene illustration.
- **Result entrance:** Results fade up with stagger (0.05s per item, fast)
  after search executes.
- **Filter interaction:** Active filter pills animate in with scale
  (0 → 1, 0.15s). Remove animates out with scale (1 → 0).
- **Avoid:** Atmospheric backgrounds on the results area, heavy photography
  density in the results list, and decorative scenes that compete with content.

### 10. Settings and Safety

**Keywords:** settings, preferences, admin, permissions, billing settings, account, security

**Use when:** the user is configuring the system and mistakes are costly.

**Apply:**
- Group by mental model, not database model
- Make destructive actions spatially separate
- Add confirmation, preview, or consequence copy for risky changes
- Use defaults and explanations to reduce hesitation

**Avoid when:** the screen is actually a workflow disguised as settings.

**Steal the mechanism, not the skin:** risk containment, not generic sidebar settings pages.

#### Visual Execution

- **Layout:** Left nav 200-240px + right content area `max-width: 720px`. Each settings section is a card or bordered group. Destructive actions in a separate section at page bottom, visually separated.
- **Spacing:** 24px between setting rows. 48px between settings sections. 16px between label and control within a row. 64px before the destructive/danger section.
- **Typography weight:** Section header 600/18px. Setting label 500/15px. Setting description 400/13px neutral-500. Danger section header 600/16px in red-700.
- **Color distribution:** 98% neutral. Red accent only in danger zone (border-left 3px red, red text header, red outline destructive button). Primary accent only on save/toggle active states. No decorative color.
- **Component density:** Each setting is a single row: label + description left, control right. Max 6-8 settings visible per section before scroll. Toggle switches preferred over checkboxes. Dangerous actions require typed confirmation.
- **Key CSS pattern:**
  ```css
  .settings-layout { display: grid; grid-template-columns: 220px 1fr; gap: 0; min-height: 100vh; }
  .settings-nav { border-right: 1px solid var(--neutral-200); padding: 24px 0; position: sticky; top: 0; align-self: start; }
  .settings-content { max-width: 720px; padding: 32px 48px; }
  .settings-section { margin-bottom: 48px; }
  .setting-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 0; border-bottom: 1px solid var(--neutral-100); }
  .setting-info { flex: 1; margin-right: 24px; }
  .setting-label { font-weight: 500; font-size: 15px; }
  .setting-desc { font-size: 13px; color: var(--neutral-500); margin-top: 4px; }
  .danger-zone { margin-top: 64px; padding-top: 32px; border-top: 2px solid var(--red-200); }
  .danger-zone h3 { color: var(--red-700); }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Section icon SVGs:** Each settings section gets a small (20x20) inline
  SVG icon next to its header. Simple line-art style, single color
  (neutral-500).
- **Toggle animation:** Setting toggles animate smoothly (0.2s, ease).
- **Danger zone animation:** Destructive action confirmation modal enters
  with a subtle scale-up (0.95 → 1) to convey weight.
- **Avoid:** Photography, atmospheric backgrounds, decorative accents, and
  entrance animations. Settings pages need trust through stability, not flair.

### 13. Mobile App Design

**Keywords:** mobile app, native app, iOS, Android, tab bar, navigation, thumb zone, 
safe area, bottom sheet, push/pop

**Use when:** `product_surface = mobile-app`. This is a BASE LAYER technique — always 
applied first, then overlay a screen-level technique on top.

**Apply:**
- Every screen wrapped in phone frame with status bar, nav bar, tab bar, safe areas
- Primary actions in thumb zone (bottom 1/3)
- Touch targets ≥ 44x44pt (iOS) / 48x48dp (Android)
- Platform-specific components (see `mobile-app-patterns.md`)
- `:active` press states, never `:hover`

**Also use for responsive mobile web when:** the primary viewport is mobile and 
reachability matters. In that case, skip the phone frame but keep thumb zone and 
touch target rules.

**Avoid when:** desktop is the real primary work surface.

**Steal the mechanism, not the skin:** reachability, task pacing, and platform-native 
composition — not app-store visual clichés.

#### Visual Execution (iOS default)

- **Layout:** Phone frame 393x852pt. Nav bar 44pt + status bar 59pt at top. Tab bar 
  49pt + home indicator 34pt at bottom. Content scrolls between them. Single column.
  Horizontal scroll only for carousels/galleries.
- **Spacing:** 16px horizontal padding (screen edges). 20px between grouped list 
  sections. 0.5px dividers (inset 16px from left). No section gaps > 32px — this 
  is an app, not a marketing page.
- **Typography weight:** Large title 700/34pt (top-level tabs only). Nav title 
  600/17pt. Body 400/17pt. List title 400/17pt. List subtitle 400/15pt secondary. 
  Tab label 500/10pt. Section header 400/13pt uppercase.
- **Color distribution:** Nav bar and tab bar: translucent blur bg 
  (rgba(249,249,249,0.94) + backdrop-filter). Active tab = tint color. 
  Content bg: system white or #F2F2F7 (grouped). Cards: white with 10pt radius, 
  no shadow (or very subtle). Tint color default: #007AFF.
- **Component density:** Touch targets 44x44pt min. Tab bar 3-5 items max. 
  List rows show 6-8 visible before scroll. Grouped list sections with headers. 
  Bottom sheets for secondary actions, not new screens.
- **Key CSS pattern:** See `mobile-app-patterns.md` §3 for full component CSS 
  (tab bar, nav bar, list view, bottom sheet, search bar, segmented control).

#### Visual Execution (Android variant)

- **Layout:** Same structure but: top app bar 64dp (title left-aligned), bottom 
  nav 80dp with pill indicator. FAB at bottom-right 16dp above bottom nav.
- **Typography:** Roboto. Body 16sp. Headline 28sp. Top bar title 22sp.
- **Components:** Ripple effect on tap. Bottom sheets peek at 50% by default. 
  Material 3 color system with tonal elevation.

#### Visual Assets

- **Image route:** Use image_search → Unsplash source URL → CSS icon-only. 
  Photography only when it supports the screen content (e.g., product detail hero, 
  profile photo). Most app screens are icon + text layouts.
- **Icons:** Iconify API only. `lucide` or `ph` for iOS, `mdi` for Android.
  See `mobile-app-patterns.md` §8 for specific icon examples.
- **Entrance animations:** Screen transitions use slide-left/right (0.3s). 
  List items stagger fade-up on first load only.
- **Tab bar interaction:** Active icon color transitions (0.15s).
- **Avoid:** Heavy photography, hero sections, noise textures, marketing 
  compositions, decorative illustrations, and web-style section rhythm.

### 15. Collaborative Workflow

**Keywords:** collaboration, comments, tasks, handoff, team, assign, timeline, workflow

**Use when:** multiple people coordinate around shared objects and status.

**Apply:**
- Make object state and ownership visible at a glance
- Keep communication attached to the relevant object
- Surface next actions and blockers close to the work item
- Differentiate awareness UI from action UI

**Avoid when:** the product is single-player and collaboration chrome adds noise.

**Steal the mechanism, not the skin:** coordination clarity, not copied project-management visuals.

#### Visual Execution

- **Layout:** Desktop: left panel (list/kanban 55-60%) + right detail panel (40-45%), separated by 1px border. Mobile: list view -> tap opens detail as full-screen push.
- **Spacing:** 16px between list items/cards. 24px internal padding in detail panel. 12px between metadata fields in detail. 32px between detail sections (description, comments, activity).
- **Typography weight:** Item title 600/15px. Status label 500/12px uppercase. Assignee name 400/13px. Timestamp 400/12px neutral-400. Detail section header 600/14px.
- **Color distribution:** Status indicators use semantic colors (dot 8px + label): blue=in progress, green=done, yellow=blocked, neutral=todo. Avatar circles with initials or images. Accent color only on active/selected item in list.
- **Component density:** List shows 8-12 items before scroll. Kanban shows 3-4 columns. Detail panel has: header (title + status + assignee), body (description), footer (comments/activity). Comments chronological, newest bottom.
- **Key CSS pattern:**
  ```css
  .collab-layout { display: grid; grid-template-columns: 1fr 400px; height: 100vh; }
  .item-list { overflow-y: auto; border-right: 1px solid var(--neutral-200); }
  .item-card { padding: 12px 16px; border-bottom: 1px solid var(--neutral-100); cursor: pointer; display: flex; align-items: center; gap: 12px; }
  .item-card.selected { background: color-mix(in srgb, var(--primary) 6%, white); border-left: 3px solid var(--primary); }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .detail-panel { padding: 24px; overflow-y: auto; }
  .avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--neutral-300); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **Workspace visuals:** Collaboration screens are content-first. Use avatars,
  status dots, and real shared-object thumbnails; staged photography should
  stay outside the primary workspace.
- **Online presence pulse:** Avatar dots for "online" status use a subtle
  green pulse animation (2s loop, low intensity).
- **Status transitions:** When an item's status changes, the status dot
  and label animate color (0.3s crossfade).
- **Activity feed entrance:** New activity items slide in from top with
  fade (0.2s).
- **Avoid:** Photography-led hero treatments, atmospheric backgrounds, and
  decorative scenes. Collaboration tools are workspaces — flair distracts
  from the work content.

### 16. AI Copilot and Generative Guidance

**Keywords:** AI, copilot, assistant, prompt, generate, suggest, automation, draft

**Use when:** the interface helps users create, decide, or transform content with machine assistance.

**Apply:**
- Clarify what the AI will do before it runs
- Make generated output editable, inspectable, and reversible
- Expose confidence or provenance when trust matters
- Keep prompts, actions, and results spatially connected

**Avoid when:** deterministic controls are faster and more trustworthy than AI mediation.

**Steal the mechanism, not the skin:** controllable assistance, not chatbot theater everywhere.

#### Visual Execution

- **Layout:** Prompt input area fixed bottom (like chat input). Output/response area scrollable above. Controls (regenerate, edit, accept) inline with output. If side-by-side: original content left, AI output right with distinct bg.
- **Spacing:** 16px between messages/outputs. 12px internal padding per output block. 48px from last output to input bar. Input bar 56px height + padding.
- **Typography weight:** User prompt 400/15px. AI output 400/15px with subtle bg distinction. Action labels 500/13px. Confidence/source labels 400/12px neutral-500.
- **Color distribution:** AI output uses subtle brand tint bg (primary at 3-5% opacity) or neutral-50 to distinguish from user content. Inline actions (edit, accept, reject) use neutral ghost buttons. Loading state uses skeleton + streaming text animation.
- **Component density:** Each output block is self-contained with its own action bar (accept/edit/regenerate). Max 1 prompt input visible. Loading indicator replaces output area, not overlays. Confidence badge small and inline, not a separate component.
- **Key CSS pattern:**
  ```css
  .copilot-layout { display: flex; flex-direction: column; height: 100vh; }
  .output-area { flex: 1; overflow-y: auto; padding: 24px; }
  .ai-output { background: color-mix(in srgb, var(--primary) 4%, white); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .ai-output .actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--neutral-200); }
  .ai-output .actions button { font-size: 13px; font-weight: 500; padding: 6px 12px; border-radius: 6px; }
  .prompt-bar { position: sticky; bottom: 0; padding: 16px; background: white; border-top: 1px solid var(--neutral-200); }
  .prompt-bar textarea { width: 100%; min-height: 44px; padding: 12px; border: 1px solid var(--neutral-300); border-radius: 12px; font-size: 15px; resize: none; }
  ```

#### Visual Assets

- **Image route:** Follow Step 0.5 detection. Route A (generate) if available,
  Route B (stock) as fallback, Route C (css-only) as last resort.
- **AI surfaces:** The AI output is usually the visual. Use screenshots,
  previews, or user-content thumbnails only when they clarify the result;
  otherwise stay Route C.
- **Streaming text animation:** AI output appears with a typewriter/streaming
  effect. Characters reveal left-to-right or line-by-line.
- **Skeleton loading:** While AI processes, show skeleton placeholder with
  shimmer animation (gradient slide left-to-right, 1.5s loop).
- **Thinking indicator:** Three dots pulsing in sequence (0.2s stagger)
  near the prompt area.
- **Output distinction glow:** AI-generated content block has a subtle
  left-border animation that fades from primary color to transparent
  on appearance.
- **Avoid:** Static placeholder images, staged photography, and illustration
  scenes. The AI's output is the visual content — frame it, don't compete with it.

## Tone Modifiers

### 4. Trust and Credibility Lift

**Keywords:** trust, credibility, security, testimonial, social proof, compliance, proof, brand risk

**Use when:** hesitation comes from doubt rather than task complexity.

**Apply:**
- Put trust signals near the risky action
- Use concrete evidence: numbers, logos, guarantees, process transparency
- Reduce vague marketing claims; increase verifiable detail
- Let the UI feel stable and intentional, not flashy

**Avoid when:** the real issue is poor task clarity. Trust badges cannot rescue confusion.

**Steal the mechanism, not the skin:** evidence placement, not logo-wall decoration.

#### Visual Overlay

Apply these adjustments ON TOP of the matched screen-level technique:

- **Trust signal placement:** Within 8-16px of the primary CTA — above or below, never more than one scroll away. Use small text (12-13px) + inline icon (lock/shield, 16px).
- **Testimonials:** Blockquote style with avatar (32px circle) + name + role. Max 2 per section. Don't stack more.
- **Tone shift:** Reduce playful elements. Increase whitespace slightly. Use neutral-600+ for body text (darker = more serious).
- **Evidence style:** Concrete numbers ("10,000+ teams"), recognizable logos (row, grayscale, 24px height), explicit guarantees ("30-day money back").
- **Don't:** Add trust badges to every section. Don't use alert/warning colors for trust signals. Don't use generic stock-photo humans.

### 14. Premium Calm

**Keywords:** premium, luxury, calm, minimalist, editorial, refined, quiet confidence

**Use when:** the product needs trust and sophistication without feeling cold.

**Apply:**
- Use restraint: fewer accents, stronger typography, cleaner spacing
- Let one material or visual gesture carry character
- Increase whitespace before adding decoration
- Use motion sparingly and precisely

**Avoid when:** users need high-density operational speed.

**Steal the mechanism, not the skin:** restraint and confidence, not beige minimalism by default.

#### Visual Overlay

Apply these adjustments ON TOP of the matched screen-level technique:

- **Spacing multiplier:** Increase all spacing values from the base technique by 1.3-1.5x. More whitespace = more calm.
- **Typography:** If the base technique uses a sans-serif, switch to a light weight (300-400) or consider a serif for headings. Add `letter-spacing: 0.01-0.02em` on headings.
- **Color restraint:** Reduce accent color usage to < 10% of visible area. No gradients. No saturated backgrounds. Shadow: `0 1px 3px rgba(0,0,0,0.08)` max.
- **Borders:** 1px hairline in neutral-200 or neutral-300. No heavy borders. No colored borders except primary for focus states.
- **Motion:** If the mockup includes transitions, duration 300-500ms with ease. No bouncy spring animations. No attention-grabbing motion.
- **Don't:** Strip all personality. Calm != boring. One distinctive gesture (a unique font, a single accent color, a subtle texture) is fine. Remove two or more and it's generic.

## State-Level Patterns

### 11. Empty State Guidance

**Keywords:** empty, no data, first project, no results, blank slate, nothing here

**Use when:** users hit a zero-content state that should still move them forward.

**Apply:**
- Explain what is missing and what they can do next
- Offer one strong primary action
- Use example structure if it reduces setup anxiety
- Match tone to the product, but keep the next step concrete

**Avoid when:** the state is transient loading mistaken for empty.

**Steal the mechanism, not the skin:** forward momentum, not cute decorative visuals by default.

### 12. Error Recovery and Resilience

**Keywords:** error, failure, retry, blocked, permission denied, timeout, invalid

**Use when:** something has gone wrong and the user needs a path forward.

**Apply:**
- Name the problem plainly
- Offer the best next action, not just the diagnosis
- Distinguish recoverable vs. unrecoverable states
- Preserve user work whenever possible

**Avoid when:** the issue is not an error but a missing prerequisite that should be prevented upstream.

**Steal the mechanism, not the skin:** recovery guidance, not dramatic red banners.
