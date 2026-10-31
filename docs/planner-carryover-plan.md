# Project clustered carryover finishes and future daily mushrooms

## Purpose / Big Picture

In /Users/adechen/Projects/pikmin-bloom, Calendar is a projection tool. Users hold battles started late in one month so they finish in the next month's event, often twenty on one day. They then insert hypothetical daily mushrooms among those finishes to see how event steps rearrange. This is not a spending ledger. The user explicitly corrected the broader accounting design during implementation; remove it completely.

## Progress

- [x] Extend repeated stage templates only as far as the actual projection requires.
- [x] Remove month selection, other-month/archive UI, used-elsewhere ledger and confirmed-use tracking.
- [x] Restore date chips from today to the last actual finish, with one available color for 0–2/3 and a full color for 3/3 or more.
- [x] Clarify that chips count attempts started on their date; every hypothetical requires a finish date/time; start metadata is optional.
- [x] Add optional calculator round trip, retaining existing calculator drafts and editor cancellation.
- [x] Final tests, build and responsive browser evidence after the user's projection corrections (223 tests).
- [x] Make end time mandatory and start metadata optional, with planned-only controls.
- [x] Remove Halloween from manual dropdown suggestions while retaining uploaded labels.
- [x] Verify once-per-date automatic scrolling to today's finish, active Calendar only; rerun final checks and browser proof.

## Surprises & Discoveries

The allocator previously appended four extra stages for one overflow mushroom. It now adds individual stages. The initial daily-accounting expansion misunderstood the user's intent and was explicitly rejected. The user clarified through text replies that chips should start today and represent attempts started that day, which can finish later. Only actual/manual screenshot records determine the last chip date; hypothetical additions never extend that range.

## Decision Log

2026-10-30, user correction: Primary information is projected destruction order and event progression. Restore the hypothetical daily tries accordion. Colors now distinguish available attempts (0–2/3) from fully accounted starts (3/3 or more), following the latest correction. Keep extras allowed. Remove actual-spending and confirmation features.

2026-10-30, user clarification: Include the remaining current-month days. A day chip is a starting-attempt date, not necessarily the destruction date. The user must choose a valid finish date/time. Later clarification makes start metadata optional; a selected day chip still allocates that start day.

2026-10-30, Codex: The event projection has no month switcher. For late-month use (after the 15th), project the following month; for early-month use, retain the current event month. This keeps November as the target across October 31 / November 1. Only finishes in that event month fill its stages. Previous-month records remain stored to avoid destructive migration, but there is no archive UI. Date chips start today and end at the latest actual finish, capped at the target event month's end. No chips are inferred from hypothetical-only data.

2026-10-30, Codex: Standard manual/screenshot mushrooms have unknown start dates unless explicitly supplied; do not infer them from countdowns. Records without start-day metadata are left unassigned to a daily-start chip; a finish date does not imply a start date. Optional calculated starts can fill the appropriate start-day chip. A planned start remains a projection, not a claim that a battle began.

2026-10-30, Codex: Keep Calculate start time behind a secondary editor disclosure. Carry title/type/desired finish into the existing calculator's Start time mode. Require Use in planner to save the result, preserve the record ID, and restore the pre-existing calculator form. Cancellation resumes the unsaved editor without modifying browser records. The manual dropdown offers generic Event presets and excludes Halloween suggestions from uploaded labels. Uploaded labels remain unchanged. Unknown seasonal health is never guessed; the user chooses the appropriate calculator type/health. Screenshot updates preserve calculated start metadata.

## Outcomes & Retrospective

Completed with finish-first editing and planned/running separation: 229 tests in 23 suites pass, along with TypeScript, ESLint, production build, and git diff --check. Browser verification added an October 31 start finishing November 1, observed the chip becoming 1/3 and later actual mushrooms moving down the event steps, then removed only that temporary record. The original five screenshots and three previous hypothetical records were preserved. Optional calculator cancellation returned to the unchanged editor. No reference-derived features, deployment, commit, or new dependencies.

## Context and Orientation

src/stagePlanner.ts contains four-stage task templates, dynamic allocation, persistence and IANA clock resolution. src/hypotheticalTries.ts contains the event-month inference, bounded date-chip range and start-day counts. src/DailyTries.tsx renders the chips and dated hypothetical form. src/MushroomPlanner.tsx renders the target-month projection and edits records. src/plannerCalculator.ts converts a mushroom into a calculator request/result; src/View.tsx owns the transient handoff. src/MushCalcRadio.tsx preserves its previous form while calculating a requested start. src/calendarScreenshotImport.ts handles matching updates for screenshots and manual entries; hypothetical tries remain independent.

## Plan of Work

Generate stage 5 only when the first 39 mushrooms fill stages 1–4, then stage 6 only when stage 5 fills. Keep all sixteen original tasks visible for orientation. Use hypotheticalDays to enumerate calendar dates from today to the latest actual end, excluding hypothetical records from the horizon. Render each day in blue below 3/3 and green for at least 3/3. Selecting a chip assigns that start day without scrolling; its start-day picker is optional and collapsed. The required finish clock determines stage position, independently of the start day. Add exactly one hypothetical mushroom per action at the chosen finish time. Clear/Undo remain limited to hypothetical records.

Remove every runtime use of eventMonth/usedElsewhere persisted state, usesFreeTry and startConfirmed. Ignore old unknown properties when loading. Do not show an Other months accordion or month selector. Preserve actual source records. Optional startAt/plannedAp/plannedHealth remain metadata for the calculator flow and row annotation.

## Concrete Steps

From /Users/adechen/Projects/pikmin-bloom run npx tsc --noEmit, npm run lint, CI=true npm test -- --watchAll=false --runInBand, npm run build and git diff --check. Inspect localhost:3000 at 320px and 390px through browser tools. Reset temporary viewport overrides and close task-created tabs. Do not modify original screenshots or user records during browser checks.

## Validation and Acceptance

Forty mushrooms produce stages 1–5, not 6–8; step 5–1 matches 1–1. Simultaneous finishes fill successive tasks. A hypothetical starting October 31 and finishing November 2 increments the October 31 chip and is placed among November 2 finishes. Zero-use days remain visible. A hypothetical finishing November 20 cannot extend a horizon whose last actual ends November 6. Every hypothetical has a valid finish date/time. A start day is optional; if supplied, finish cannot precede it. Running screenshot records have no start controls, annotations or start-day count. There is no month-switching or archive UI. A user can edit past mushrooms within the current projected event. Calculate start time preserves the desired finish instant across DST and returns the result once; cancellation restores the editor and does not modify stored records. The normal calculator draft survives both paths. Screenshot updates keep planned-start metadata.

## Idempotence and Recovery

Keep the existing browser storage key and retain existing records, ignoring obsolete optional accounting/month properties. Repeated screenshots update the same normalized title/type. Clear and individual removals remain undoable. Browser QA must not add fake usage counts, confirm attempts, or edit existing screenshots just to exercise the handoff; cancellation and isolated test records suffice.

## Artifacts and Notes

Final follow-up tests passed 229/229. Automatic scrolling is tested with November 4 as today, including hidden Calendar and repeat visits. Browser checks confirmed no start section on running Halloween screenshots, only Giant Event in a manual Giant search, and a planned entry that can save with no start supplied. The unsaved preview was cancelled and original records preserved. Latest proof: /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/planned-mushroom-end-first.jpg. The responsive browser had document width equal to viewport width at both 320px and 390px. Final screenshot: /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/hypothetical-start-day-projection.jpg. It shows October 31 as the selected starting day and November 1 as the finish. Temporary viewport overrides were reset and task-created browser tabs closed.

## Interfaces and Dependencies

PlannerFinish retains id/title/type/endAt/source and optional status (planned or running), tryDay/startAt/plannedAp/plannedHealth/capturedAt/filename. projectionMonth(now, timezone) returns the inferred target month. hypotheticalDays(finishes, timezone, now) returns bounded date strings. hypotheticalCount(day, finishes, timezone) counts known starts, without inferring a start from a finish date. PlannerCalculationRequest holds an ID and PlannerFinish draft. Use existing React, MUI, Dayjs and Intl.

Plan rewritten 2026-10-30 after the user rejected spent-attempt tracking and confirmed that chips represent attempts started today or later.

Plan completed 2026-10-30 after validating the final user-confirmed start-day chip semantics.

2026-10-30 follow-up: End time is primary and mandatory. Start information is optional and only editable on planned records. New manual entries are always running battles; retain any legacy explicitly planned entries. Screenshot imports always represent running battles. Only running records extend the actual-finish horizon. Calendar automatically locates the first finish on today's date once when visible, respecting the selected timezone and preserving later manual scrolling. No fallback to a future date is imposed when today's date has no finish.

Follow-up completed 2026-10-30: mandatory finish, optional planned-only start, Halloween excluded from suggested manual options, active-only automatic today scrolling, TypeScript/lint/build checks, and 229 passing tests.


2026-10-30 latest simplification: Top Add mushrooms is exclusively for existing battles, with Upload screenshots (multi-file) and Add manually. No manual status switch. Hypothetical daily tries remain separate and add one at a time. Remove chip auto-scroll and Plan remaining. Keep main timeline today-scroll; remove Hide completed steps and ignore that saved preference, preserving access to past finishes. Use one chip color below 3/3 and another at or above 3/3. Review can append more screenshots without discarding current drafts. Normalized title + type deduplicates screenshots and manual entries, including a manual edit that collides with another saved battle; hypothetical tries remain distinct. Older screenshot captures cannot overwrite newer observations. Matching imports collapse existing duplicates to the newest observation.

Latest validation: 237 tests across 24 suites pass; TypeScript, ESLint, production build, and git diff --check pass. Mobile browser review successfully read two real screenshots, retained them when a third was appended, and labeled every matching observation Update existing. Cancelled the review without saving. Manual entry shows no status switch or start-planning controls. Direct chip tap preserved document scroll position (1951 before and after). Existing records were preserved, viewport reset, and temporary tab closed. Proof: /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/simplified-daily-tries.jpg.


2026-10-30 manual-entry correction: Adding a running battle manually now asks for its in-game countdown (days, hours, minutes, seconds), initially zero and requiring a positive valid duration. Compute the absolute finish from the submission instant plus elapsed seconds, including across DST. Do not ask for an absolute finish during addition. Existing finish corrections and hypothetical planning retain the shared date/time picker. Keep name/type deduplication. The non-mushroom visibility control becomes a small secondary text button, switching between Hide non-mushroom steps and Show all steps, with aria-pressed state and a 44px touch target.


Manual countdown follow-up validated: 238 tests across 24 suites, TypeScript, ESLint, production build, and git diff --check pass. Regression coverage checks a positive valid duration, elapsed-time addition across DST, save-time anchoring after a two-minute wait, storage restoration, and manual deduplication. Mobile browser showed four numeric fields with no date picker; a sample countdown enabled Add mushroom. Cancelled the example, preserved saved records, reset viewport, and closed the temporary tab. Proof: /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/manual-countdown-entry.jpg and quieter-planner-controls.jpg in the same directory.
