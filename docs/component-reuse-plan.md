# Consolidate shared calculator patterns and review usability

This living execution plan follows the execution-plan skill. Its Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective sections must stay current.

## Purpose / Big Picture

Make the app easier to maintain by reusing the calculator's field styling and common behavior across Calculator and Calendar. Keep the existing workflows, countdown meaning, saved records, and event allocation unchanged. Separately, produce an independent usability review with recommendations grounded in user tasks and official UX/accessibility guidance. UX recommendations are documentation only and are not authorization to redesign the app.

Users spend up to three free mushroom attempts each day; unused attempts expire that day. A battle consumes an attempt when joined and can contribute event progress when destroyed at its finish time, provided the relevant event task is active. Players deliberately carry slow battles into the following monthly event. The planner should help reason about clustered finishes, sleep hours, intervening walking/planting tasks, and future daily attempts. An ordered projection cannot prove that every finish actually counted. This domain context informs the review, independently of the user's prior layout proposals.

## Progress

- [x] (2026-10-30) Inventory active and dormant source, existing shared fields, duplicate countdowns, screenshot readers, and styles; baseline was 238 passing tests at the preceding completed change.
- [x] Assign primary-source UX research to a background reviewer with fresh context and explicit domain intent; app source edits remain the parent's responsibility.
- [x] Consolidate calculator-authoritative countdown fields, paired-field styles, mushroom selection, and responsive picker configuration.
- [x] Consolidate screenshot input, progress, cancellation and timeout handling without combining their different save flows.
- [x] Separate the planner editor from timeline rendering and document remaining maintenance opportunities.
- [x] Validate all workflows with existing regression tests, focused new lifecycle coverage, type checking, lint, build, and responsive browser inspection.
- [x] Deliver the independent UX review with evidence, priority, recommendations, and validation limits.

## Surprises & Discoveries

The current UI mounts View, which presents MushCalcRadio and MushroomPlanner. Timeline, EventList, MoreInfo and MushStages are an older unused UI; MushroomProvider is still mounted by index.tsx and maintains a separate legacy storage key. Do not claim their controls are visible in the live app. ExistingMushroomCalc, manual addition, and screenshot review duplicate the four duration units. Calculator and planner type fields have deliberately different values: calculators need a known preset with health/AP metadata, while imported seasonal names must remain editable strings. They can share a domain field with explicit preset/custom modes, but must not coerce unknown types or invent health.

## Decision Log

2026-10-30: The first clause authorizes source refactoring for reuse and visual conformity; the usability clause requests suggestions only. Keep these deliverables separate. Preserve calculator visuals as the reference. Extract at real reuse points; do not wrap every MUI primitive, delete legacy features, change dependencies, migrate storage, or implement UX recommendations.

2026-10-30: The user clarified domain intent while work was in progress. The independent review must use that intent, while avoiding deference to previous UI suggestions. Existing allocation and hypothetical-start rules remain unchanged during refactoring.

## Outcomes & Retrospective

Shared fields, style configuration, screenshot lifecycle and planner record matching are implemented. All 243 tests in 25 suites pass, including the full existing 238-test contract and five new lifecycle cases. TypeScript, ESLint, production build and git diff --check pass. Browser verified desktop calculator and 390/320px layouts with real local OCR in both flows. The independent UX review is complete with 18 prioritized recommendations, concise copy alternatives, primary sources, scope limits and browser evidence. No UX recommendations were implemented. Existing working tree contains substantial user-authorized prior work, including untracked source and tests; preserve all of it. No commit or deployment is required.

## Context and Orientation

The repository is /Users/adechen/Projects/pikmin-bloom, a React/TypeScript app using installed MUI and Dayjs. src/App.tsx owns theme and mobile keyboard layout; src/View.tsx owns navigation and the optional planner/calculator handoff. src/MushCalcRadio.tsx is the calculator style reference. src/ExistingMushroomCalc.tsx owns the running-battle snapshot. src/MushroomPlanner.tsx owns projected tasks, persistence and editing. src/BattleScreenshotUpload.tsx immediately fills calculator fields; src/CalendarScreenshotUpload.tsx reviews a batch before saving. src/NumberSpinner.tsx and src/SimpleDateTimeInput.tsx already provide shared fields. src/stagePlanner.ts and src/helpers.ts hold tested date/allocation/calculation rules. docs/ux-review.md will hold research; docs/component-reuse-review.md will map consolidation choices and remaining code maintenance findings.

## Plan of Work

First introduce CountdownFields with the calculator's small integer fields, ranges, two-column phone/four-column desktop grid, and focus grouping. Reuse it in running calculator, manual battle addition, and screenshot review, preserving each caller's null/zero policy. Reuse the calculator's paired-field styles and picker layout configuration. Extend MushroomTypeField with an explicit preset mode for calculator and legacy preset selection; retain custom seasonal strings for Calendar.

Then create a small screenshot-reader hook owning abort controllers, per-file timeout, progress, stale-result suppression, and cleanup. Keep batch review vs immediate autofill decisions in callers. Reuse a file input that resets after selection and a progress presentation, preserving current labels, multi-file support and local processing. Move the planner editor to its own file so projection rendering does not also contain all form controls.

Use the existing tests as behavioral contracts. Add focused lifecycle regression coverage for the shared reader rather than tests that merely repeat JSX structure. Do not adjust event assignment, month inference, countdown anchoring, duplicate matching, or hypothetical identity during this work. Review all other source areas for reuse, documenting when differences are intentional or legacy-only.

## Milestones

The first milestone consolidates fields. Calculator inputs must retain their labels and behavior; manual countdowns and screenshot countdowns acquire the same calculator grid/ranges. The second milestone consolidates asynchronous reading while keeping cancellation and batch partial success working. The third milestone validates the complete app and finishes the separate review. A novice can execute milestones in order using the file map above and commands below.

## Concrete Steps

From /Users/adechen/Projects/pikmin-bloom, run npx tsc --noEmit, npm run lint, CI=true npm test -- --watchAll=false --runInBand, npm run build, and git diff --check. The localhost preview is already running at http://127.0.0.1:3000/. Use browser controls to verify Calculator and Calendar at desktop, 390px and 320px. Cancel unsaved test forms/imports; preserve existing records. Save screenshots outside the repo under the task visualization directory, reset viewport overrides, and close only task-created tabs.

## Validation and Acceptance

New-battle calculator derivations and optional join planning behave as before. Running-battle screenshot import fills editable snapshot fields, and cancellation restores manual input. Calendar batch reading retains successful drafts after a file fails and appends more screenshots without discarding earlier drafts. Same-name/type battles update once; hypothetical tries remain independent. Manual countdowns resolve from submission time, including across daylight-saving changes. Existing finish corrections, timezone gaps/repeats, planner handoff and calculator drafts remain covered by existing tests. No new storage key, schema migration, external upload, dependency, automatic event behavior, or UX recommendation is implemented.

## Idempotence and Recovery

The shared modules can be introduced additively then callers switched one at a time. Current src was copied to a unique /private/tmp/pikmin-reuse directory before editing, allowing comparison without relying on Git for pre-existing untracked files. Revert only this task's changes if necessary; do not reset the shared working tree. Do not touch uploaded image files or old browser storage.

## Artifacts and Notes

Keep focused test output and responsive evidence in the final outcomes. Link source files with full absolute paths in the user-facing review. Record guidelines as direct official links near each finding. Distinguish observed UI evidence, code-only risks, and design hypotheses needing real-user testing.

## Interfaces and Dependencies

Use the existing React, MUI, Dayjs and local OCR packages. CountdownFields accepts a TimeRemainingInput and a unit/value callback; it does not own validation or calculate timestamps. A shared screenshot reader accepts files and result/error callbacks and exposes busy/progress/cancel; it must suppress callbacks from canceled, replaced or unmounted requests. MushroomTypeField supports known preset objects and custom string values as two explicit variants. Keep UI state in existing owners and pure calculation rules in their tested modules.

Created 2026-10-30 for the comprehensive reuse and independent usability review, updated with the user's clarified carryover-planning intent before implementation.

2026-10-30 implementation update: Also moved unchanged theme to theme.ts and name/type record matching to plannerRecords.ts. Cancellation now settles promptly through an abort race even when an underlying reader ignores cancellation; focused tests demonstrate this behavior. The independent UX review now assumes game expertise and recommends explaining only app-specific semantics, following the user's latest clarification.


Completed 2026-10-30. Source consolidation is mapped in docs/component-reuse-review.md; independent suggestions are in docs/ux-review.md. Preserve experienced-player brevity: recommendations explain app behavior rather than game concepts. User records and original screenshots remain unchanged; temporary browser forms were cancelled, viewport restored and test tab closed. Existing working-tree changes remain uncommitted; no deployment or dependency updates. Evidence images are linked in both review documents.
