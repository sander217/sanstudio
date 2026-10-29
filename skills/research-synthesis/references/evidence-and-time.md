# Evidence, counting, and time

Use this reference for mixed sources, quantitative claims, version comparisons, and research that accumulates across rounds. Keep records proportionate: a small task can use an inline table; ongoing work benefits from a reusable evidence record. No database or connector is required.

## Source and claim records

Assign stable IDs so later updates can point to what changed.

| Field | Record |
|---|---|
| Evidence ID and locator | Original URL/file and message, timestamp, ticket field, page/table, or calculation |
| Type and role | Interview, observation, metric, tracker metadata, stakeholder belief, external study, design context |
| Origin and relay | Whose experience/result; who relayed it; original incident/study when known |
| Evidence | Exact quotation, observation, or result; interpretation separate |
| Population and situation | People, task, environment, product/version; unknown fields stay unknown |
| Time | Event/data collection, publication/recording, retrieval/check, analysis cutoff |
| Quality and scope | Method, coverage, access, selection bias, uncertainty, applicability |
| Relation to finding | Supports, challenges, inconclusive, or not applicable; explain why |

Internal opinion can be useful context without proving user behavior. A secondhand report is usable with its attribution intact. Check an existing report against its original evidence when accessible; otherwise label it a secondary claim.

A quote supports only what it says. "Works better" supports reported improvement for that person, not elimination of a defect or identification of the responsible component. Preserve that distinction in the summary.

## Counting without false corroboration

Keep four quantities separate:

- **Records:** Files, messages, tickets, calls, or reviews received.
- **Independent experiences/observations:** What remains after tracing incidents and relays.
- **People:** Distinct originators, with uncertainty when identity is unclear.
- **Exposure:** People, sessions, or attempts that could encounter the issue, if measured.

Three records may describe one customer incident. One tester may document distinct failures while representing one reporter and a tester-selected set of paths. A follow-up workaround adds evidence without adding an affected person. Unknown overlap is not proven independence: report a known minimum or uncertainty rather than a convenient total.

For mixed corpora, count within source types; do not divide interviews plus tickets by users. State raw counts and the independent unit used by a finding. Do not add counts across overlapping findings. Reconcile the raw inventory into evidence, context-only, excluded, and ungrouped records, using structured calculation when manual checking is unreliable.

Count external evidence by its original study/dataset, not articles repeating it. A vendor announcement and three articles citing it remain one underlying claim.

## Quantitative evidence

Before publishing a rate, change, benchmark, or effect, inspect:

- Metric, numerator, denominator, unit, cohort, and observation period.
- Instrumentation/definition changes, including partial completion and silent substitution.
- Baseline/comparator and absolute versus relative change.
- Sample size, uncertainty, missingness, and selection effects where available.
- Whether the method supports causation, association, or only description.

"About 15 clicks" without impressions is a rough count, not a click-through rate or proof of underperformance. Name the missing denominator. Work completed by the system but not received by the person may fail the decision's success definition; make that definition explicit.

Retain an experiment's design and limits. For a proposed local test, specify the hypothesis and outcome, labeling a chosen threshold as proposed. Do not promise statistical significance from a small convenience sample or treat interview counts as effect estimates.

## Time and version validity

| Clock | Meaning | Frequent mistake |
|---|---|---|
| Event / collection | When experience occurred or data was measured | Treating a later ticket edit as a new incident |
| Publication / recording | When a source was written or filed | Treating backfilled reports as an outage spike |
| Retrieval / check | When the agent accessed or verified a source | Calling an old study current because it was read today |
| Product / exposure | Build, model, workflow, cohort, rollout | Applying an old failure to all current users |
| Decision cutoff | The time the analysis should inform | Using later evidence as if known at the decision |

Keep date precision honest: a month remains a month. Do not infer a session from the same username or nearby messages. Preserve known timezones when order matters; explain ambiguity if times are not comparable.

For retrospective work, distinguish evidence that existed at the cutoff from evidence the team is documented to have known then. A paper published before a decision is not automatically part of that team's rationale. Label later evidence as retrospective assessment. Do not manufacture prior knowledge or rewrite decision history.

Assess applicability through changes in task, group, locale, workflow, platform rules, model capability, pricing, or deployment. There is no universal expiry period. Older mechanism research may remain useful while recent implementation benchmarks become obsolete. Recency alone neither resolves contradictions nor establishes credibility.

Distinguish reported, triaged, fixed in code, deployed to the affected cohort, and verified in use. Recurrence after closure might reflect incomplete coverage, an old client, rollback, another cause, or failed repair. It calls for investigation; it does not prove a superficial fix. Unknown version/deployment makes the comparison inconclusive.

Do not declare a trend from filing frequency alone. Check independent event dates, comparable exposure, collection practices, cohort composition, and product changes. If unavailable, describe reports and their limits.

## Updating findings and decisions

Preserve the earlier finding ID, wording, scope, evidence, and decision date. Append:

- New evidence IDs and relevant context changes.
- Whether problem, explanation, or solution confidence changed, with reasons.
- Applicability: current, needs recheck, resolved with verification, or superseded by a named finding.
- The decision affected, chosen action or continued uncertainty, and a review trigger.

Keep severity, action status, and evidence strength separate. Work in progress does not make its research irrelevant. A new report may refine an acceptance criterion without changing the plan. Evidence from different populations may coexist rather than supersede one another.

If no earlier record is available, create a dated baseline from the supplied material. Do not imply persistent memory, prior searches, or automatic monitoring the runtime does not provide.
