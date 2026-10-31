# Implement the user's accepted planner refinements

## Purpose / Big Picture

The planner is a reference for experienced players. Continue allocating all non-missed mushrooms chronologically and assuming tasks complete as finishes pass. Users correct mistakes by editing, deleting or marking a finish missed. Do not add game tutorials, readiness tracking, completion confirmations, live clocks, observation-time precision controls or a general calculator-to-planner save flow. The fixed primary/secondary task template remains valid.

This living plan follows the execution-plan skill and supersedes recommendations in docs/ux-review.md where the user's decisions differ.

## Progress

- [x] Read user decisions and existing source/tests; baseline243 tests.
- [x] Empty initial/fallback data, conservative cleanup of untouched old sample seeds, shared storage/backup validation, latest-entry update policy, remove dead timeline/provider code.
- [x] Automatic earliest-finish month, optional bottom month control, compact chronological schedule, sleep-window and between-task gap preferences, missed/free-vs-extra entry flags, midnight refresh.
- [x] Consistent contextual validation, compact resumable screenshot review with Undo, backup/restore, reliable clipboard feedback, draft-safe update prompt.
- [x] Collapsed additional-player planning with impossible-value feedback, AP-edit relationship, concise copy, Planner destination label and focus/accessibility improvements.
- [x] Tests, type/lint/build checks and responsive browser verification; update decisions/evidence.

## Context and Orientation

/Users/adechen/Projects/pikmin-bloom is a React/TypeScript/MUI app. stagePlanner.ts owns record/state/allocation rules; hypotheticalTries.ts owns month/day/count rules; MushroomPlanner.tsx owns saved planner UI; PlannerFinishEditor.tsx edits a single record; DailyTries.tsx projects future starts. NumberSpinner, SimpleDateTimeInput and MushroomTypeField are shared fields. JoinPlanner is the optional additional-player calculator. Screenshot review is separate from calculator autofill. UpdateNotifier must offer reload instead of forcing it. Legacy Timeline/EventList/MoreInfo/MushStages/Provider/useMushroomTries are unreachable and may be deleted; do not remove the current MushCalcRadio/ExistingMushroomCalc.

## Decision Log

2026-10-30: User authorizes accepted UX findings, with explicit exceptions above. Routine helper prose is unwanted; labels and contextual errors/status suffice. Latest entry wins regardless of source/capture age; no skipped-capture notices or snapshot-discrepancy warnings. Bullhorn is effective join time. No separate invitation model. Hypothetical entries retain optional calculator handoff. Free is the default; an unobtrusive Extra try option excludes a known start from the3/day counter. Missed finishes stay editable and visible but are excluded from allocation; they still consume a start if marked free.

2026-10-30: Default event month follows earliest saved finish, never earlier than the current local month; with no saved finishes, default next month. A low-priority bottom setting permits explicit override. No all-months dashboard. Sleep preferences are used only to identify a potentially wasted finish at a task transition; there are no general sleep markers. Minimum-gap warnings apply only at transitions between mushroom tasks, never between finishes in the same task. Timing annotations inform; they never silently exclude finishes.

## Plan of Work and Milestones

First isolate fixture data from production and validate/migrate stored records without erasing user edits. Extend records with missed and usesFreeTry flags, and preferences with month/sleep/minimum-gap fields. Keep allocation pure and test task-boundary timing separately. Then implement compact Stages/Finishes views and bottom settings with backup/restore. Preserve Undo across replacement edits/imports.

Improve shared input validation without altering typed numbers or silently clamping them. Apply required/time/order errors consistently and keep successful user input. Remove static explanatory copy; contextual error messages remain. Collapse additional-player UI and explain only impossible targets or how an AP edit changes bullhorn time. Keep current math and derive only feasible plans. Make screenshot review compact for valid reads and expandable for corrections, keep drafts on close, and show errors per invalid record. Finally remove unused legacy source and update identity/navigation naming.

## Validation and Acceptance

From repository root run npx tsc --noEmit, npm run lint, CI=true npm test -- --watchAll=false --runInBand, npm run build and git diff --check. A new/damaged browser store starts with zero mushrooms. A missed finish no longer consumes an event slot. Extra starts do not reduce free allowance. Sleep windows span midnight correctly; close finishes in one task are not flagged as transition gaps. Saved-month defaults follow earliest finish and advance with the local calendar. New imported/manual observations overwrite the same name/type without age-based skip. Undo restores updates; backup round-trips; production updates do not reload drafts. Invalid numeric input remains visible with an error. Both calculator modes retain formulas and optional hypothetical handoff.

Inspect localhost:3000 at desktop,390 and320px using temporary browser tabs. Cancel unsaved test imports and delete only isolated QA records; preserve genuine user entries. Save proof outside the repo, reset viewport and close temporary tabs. Real phone keyboards/screen readers remain outside browser-emulation verification.

## Idempotence and Recovery

Keep current storage key and existing valid user records. Old untouched sample seeds may be identified by their complete record fingerprint; edited or re-imported records must survive. Empty fallback never introduces examples. Backup imports validate before replacing state and support Undo. Do not commit/deploy or alter external services.

## Surprises & Discoveries

The current additional-player section is always rendered rather than collapsed, despite the intended model; this implementation will make it explicitly optional. Numerous old tests rely on production sample defaults; move those data into test-only fixtures and seed them explicitly where the test needs records.

## Outcomes & Retrospective

Implemented and verified. All 237 tests in 27 suites pass; TypeScript and ESLint pass. Production build and git diff --check also pass; the generated production JavaScript contains none of the sample screenshot titles. Browser checks covered desktop, 390 px and 320 px, compact two-file real screenshot review, editable missed finishes with redistribution, Undo after switching views, empty/default storage through component tests, and contextual numeric/AP errors. Temporary timing scenarios were removed and the original three saved records/preferences restored through the validated backup flow. Untouched historical sample seeds were removed; production has no screenshot fixture import. Physical phone keyboard and screen-reader behavior remain outside browser emulation.

## Artifacts and Interfaces

PlannerFinish adds missed?:boolean and usesFreeTry?:boolean. PlannerState retains finishes/timezone/hideOtherSteps and adds selectedMonth?, sleepStart/sleepEnd and minimumGapMinutes. No readiness or confirmed-completion model. New timing helpers consume ProjectedStep allocation so warnings respect task boundaries. Source fixtures are for tests only, never loaded as app defaults.

2026-10-30 clarification: Sleep is only an input to potential missed-finish risk. No general sleep marker is shown. Compare available awake time at a task transition to the chosen minimum task gap; ordinary clustered finishes within the same task receive no extra annotation. Routine explanations are removed throughout, retaining labels and contextual errors/status only.

The 320 px check found the default MUI CardContent last-child padding overriding the planner’s bottom clearance. Explicit last-child padding now lets settings scroll above the floating action button. Undo ignores click-away dismissal so a user can inspect another view before reversing the last change.

2026-10-30 consistency follow-up: User requested “End time” throughout, the “End times” view label, simpler daily tries without the repeated date/free-count line, explicit Extra try and Start date controls, and a discoverable start calculator. Calculate start time is now available before adding a daily try and directly in its editor; calculated starts remain secondary schedule text. Status badges share size/type/placement and keep semantic warning color. The custom SVG favicon was authored locally for the previous implementation, and is removed in favor of the original React favicon/install icons. After clarification, the mode switch and view tabs retain their different roles and appearance. User selected sentence-case controls with numeric labels above fields; shared theme typography owns the casing policy. The text-only step filter is unchanged pending a design choice, rather than changing it merely because the user asked about conventionality. Validation: 238 tests pass, including direct daily-try calculator handoff; type/lint/build/whitespace checks pass. Responsive browser testing verified the new form and calculator round trip, then undid the temporary entry to preserve the original three records.
