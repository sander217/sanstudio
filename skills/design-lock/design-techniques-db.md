# Design Techniques Database

Use this file during Gate 3 before committing to a visual treatment.
This is a pattern library, not a style-copying catalog. Borrow the mechanism,
not the skin. The job is to match the user's problem to the right technique
cluster, then adapt it to the current product, constraints, and design system.

## Retrieval Rules

1. Extract keywords from:
   - User prompt
   - `goal`, `scope`, `constraints`, `key_insight`
   - Screen/state names from upstream blocks
2. Normalize into 5 buckets:
   - Product type: `dashboard`, `checkout`, `onboarding`, `landing`, `settings`
   - User intent: `compare`, `decide`, `scan`, `fill`, `recover`, `trust`
   - UX risks: `drop-off`, `confusion`, `density`, `hesitation`, `error`
   - Platform/context: `mobile`, `desktop`, `b2b`, `consumer`, `admin`
   - Tone: `premium`, `playful`, `serious`, `fast`, `safe`
3. Score each cluster:
   - Exact keyword match: `+2`
   - Strong intent match: `+2`
   - Product/screen type match: `+2`
   - Constraint conflict: `-2`
   - Requires pattern the design system does not support: `-1`
4. Select `1-3` highest-fit clusters.
5. If two clusters conflict, prioritize:
   - Task clarity over visual novelty
   - Error prevention over cleverness
   - Scanability over density
6. If no cluster scores well, fall back to:
   - hierarchy
   - chunking
   - progressive disclosure
   - clear primary action

## Required Output

After matching, emit:

```md
🎯 TECHNIQUE MATCH

Keywords:
- ...

Matched clusters:
- [Cluster]: [why it fits this user request]

Techniques to apply:
- ...

Techniques intentionally excluded:
- ...
```

Then propagate the chosen techniques into:
- HTML mockup structure
- Interaction Spec
- DDR
- JSON `metadata.technique_clusters`
- JSON `metadata.decisions_applied`

## Screen-Level Techniques

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

### 2. Landing Conversion

**Keywords:** landing, hero, CTA, conversion, campaign, marketing, homepage, sign up

**Use when:** the page must explain value fast and move users into one primary action.

**Apply:**
- Make the value proposition legible in 3 seconds
- Keep one dominant CTA and one secondary path at most
- Use social proof near the decision point, not buried below
- Structure sections as claim -> proof -> action

**Avoid when:** the page is primarily navigational or documentation-driven.

**Steal the mechanism, not the skin:** narrative sequencing, not somebody else's gradients and illustration style.

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

### 13. Mobile Focus and Thumb Flow

**Keywords:** mobile, app, handheld, one-hand, thumb, bottom action, compact

**Use when:** the primary viewport is mobile and reachability matters.

**Apply:**
- Keep primary actions in comfortable thumb zones
- Reduce simultaneous choices on a single step
- Use bottom sheets and segmented progression where helpful
- Preserve strong visual rhythm with larger tap targets

**Avoid when:** desktop is the real primary work surface.

**Steal the mechanism, not the skin:** reachability and task pacing, not app-store visual clichés.

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

**Steal the mechanism, not the skin:** forward momentum, not cute illustrations by default.

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
