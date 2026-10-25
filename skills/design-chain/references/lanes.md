# Lanes

A lane is the depth of the chain. It decides which gates run and how heavy G0 is. The user can set it with `lane: fast|standard|major`. Otherwise classify from the request.

## Signals

| Signal in the request or evidence | Lane |
|---|---|
| "tweak", "adjust", "polish", "make X bigger", one component named, ITERATE on a previous session | fast |
| "redesign", "new screen", "new flow", "landing page", "onboarding", a screenshot plus "improve this" | standard |
| "new app", "design system", "whole product", "for the engineers", "production", "handoff", three or more screens named | major |

When signals conflict, pick the heavier lane and say why in one line.

## What each lane runs

### fast

1. G0 research, light: Evaluate mode on the request. Two to five findings, an explicit list of unknowns, no desk research unless one search could change the decision.
2. G1 context lock: ITERATE or CONSTRAINED entry. Inherit `DESIGN.md` from the prior session when it exists; otherwise extract from the screenshot.
3. G3 design lock: one direction. Before and after diff. Hi-Fi Fill Checklist and `DESIGN.md` lint still run.

No G2. The fast lane does not explore alternatives; if G0 or G1 shows the approach itself is open, upgrade to standard.

### standard

1. G0 research, full: Explore or Evaluate as fits. Desk research allowed where it can change a direction or an acceptance criterion.
2. G1 context lock: full inference, `DESIGN.md` emitted, surface declared.
3. G2 direction lock: three directions, each tied to a finding, one recommended.
4. G3 design lock: the selected or combined direction, hi-fi, QA, optional Figma export.

### major

Standard plus:

5. G4 production lock: state matrix, screen inventory, responsive matrix, component spec, final copy, interaction and accessibility spec, dev handoff, readiness scorecard.

## Upgrades

Upgrade only at these points, and only upward:

- After G0: research shows the problem is broader than the request.
- After G1: the surface or flow count exceeds what the lane covers.

After G2 has started, do not upgrade; finish the lane and offer G4 as a follow-up. Announce every upgrade:

```
LANE UPGRADE fast -> standard
  reason: <one line citing the finding or context field>
```
