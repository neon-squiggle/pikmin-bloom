# Make every planned mushroom contribute

## Purpose / Big Picture

In /Users/adechen/Projects/pikmin-bloom, Calendar projects when mushroom battles will satisfy event tasks. Every dated mushroom must fill the next available mushroom slot in chronological order, including simultaneous finishes. Users need a single Add mushrooms entry with screenshot/manual choices, consistent calculator-style date/type controls, automatic title/type updates, balanced date/time emphasis, and daily x/3 usage instead of lifetime totals. The reference-site audit remains research only.

## Progress

- [x] 2026-10-30: Reproduce five identical-time tries allocating only two with a failing projectStages test.
- [x] Correct allocation and cover overflow, redistribution, and editing.
- [x] Unify addition, type/date controls, automatic screenshot updates, and presentation.
- [x] Show per-day allowance usage; preserve reversible daily clearing.
- [x] Run focused/full checks, responsive browser verification, and record outcome.

## Surprises & Discoveries

The existing stagePlanner.test.ts deliberately expected simultaneous finishes to remain unassigned. The new five-try regression fails with expected length 2, received length 0 for step 2–2. The allocator holds a single task for an entire equal-time batch; generated daily IDs and reactive projection are separate paths. These results establish the exact regression seam without needing instrumentation.

Using the MUI picker exposed a strict-parser issue on browser-local DST gaps. WallClockProvider subclasses the existing Dayjs adapter to parse a floating UTC clock, preserving entered values until Intl resolves the selected IANA timezone. The same shared picker now constrains its mobile grid so seconds and confirmation buttons fit at 320px; measured layout and action-bar scroll widths are 320px.

A Lord Howe timezone test caught a try-date default that followed the finish date if the user re-entered an unchanged starting day. The start day now initializes to today and stays independent of finish edits. Existing stored daily records still fall back to their finish day because their actual start day is unknown.

## Decision Log

2026-10-30, Codex: Fill every slot in sorted time order, breaking ties deterministically by ID. If the four-stage set fills, repeat its task pattern in subsequent stages so no dated record is hidden or unassigned. This is required by the user's new explicit no-unassigned rule, rather than implementing reference-derived features.

2026-10-30, Codex: Use one Add mushrooms action (floating on mobile) opening Upload screenshot and Add manually. Keep photo-plus icon and upload wording consistent with the calculator. Use shared MUI date-time picker and an editable type dropdown containing calculator presets, saved seasonal names, and arbitrary seasonal text. Preserve IANA gap/repeated-time checks by passing a floating UTC clock through the picker and resolving it separately with Intl.

2026-10-30, Codex: Show date before time with equal readable type. Replace finish/finishes-needed wording with mushrooms. Daily allowance has a separate start-day selection, defaulting to today in the selected timezone independently of the finish date, and per-day x/3 chips; allow extras. Existing daily records fall back to finish day. No actual task readiness, month filtering, or reference-site features are added.

## Outcomes & Retrospective

The implementation and responsive browser checks are complete. The original five-try failure now passes: two mushrooms fill 1–4, two fill 2–2, and one fills 2–3. Manual entry saved and reordered tasks in the browser, and its temporary record was removed. The original five screenshot records and three user-added daily tries were preserved. Final validation passed: 213 tests in 20 suites, TypeScript, ESLint, production build, and git diff --check. Planner tests also passed with Europe/Berlin and Australia/Lord_Howe browser-local timezone environments; the Lord Howe run verified the corrected independent try-day default. No deployment or commit was requested.

## Context and Orientation

src/stagePlanner.ts owns persisted PlannerFinish records, sixteen task definitions, chronological allocation, and IANA wall-clock resolution. src/MushroomPlanner.tsx owns editing, daily tries, Clear/Undo, and rendering. src/CalendarScreenshotUpload.tsx reviews local OCR results. src/calendarScreenshotImport.ts merges observations. src/PlannerFinishField.tsx currently uses a native datetime field unlike calculator's src/SimpleDateTimeInput.tsx MUI picker. src/types.ts exports calculator type presets. App.tsx supplies LocalizationProvider.

## Plan of Work

First change projectStages and its regression tests. Then reuse SimpleDateTimeInput in PlannerFinishField, preserving gap/fold resolution and adding helper/error props to the shared control. Add a shared MushroomTypeField based on calculator options, permitting unknown seasonal labels. Use it for manual editing, daily tries and screenshot review. Remove screenshot target-selection UI/data and automatically match real manual or screenshot records by normalized title/type while protecting newer observations. Add manual records with source manual, allow existing persisted sources, and preserve IDs when updated. Render subsequent stage patterns dynamically. Replace daily total with per-day usage and an explicit try date. Add integration tests for five same-time tries and manual/screenshot update behavior.

## Concrete Steps

Run from /Users/adechen/Projects/pikmin-bloom: CI=true npm test -- --watchAll=false --runInBand src/stagePlanner.test.ts. Before the fix the five-simultaneous-tries test fails at step 2–2 (zero mushrooms instead of two). After changes run npx tsc --noEmit, npm run lint, CI=true npm test -- --watchAll=false --runInBand, npm run build, and git diff --check. Inspect http://127.0.0.1:3000/ through the browser tools at desktop and mobile widths.

## Validation and Acceptance

Five same-time tries fill tasks 1–4 (two), 2–2 (two), and 2–3 (one), pushing later mushrooms down. Changing end times redistributes all records. More than 39 continues into another task set without unassigned records. Manual entry saves title/type/end time, persists across reload, and is updated by a matching screenshot. No Save as/match dropdown remains. Date picker matches the calculator and still rejects DST gaps and requires fold choice. Daily badges show each scheduled day x/3, and extras remain allowed. Clear/Undo affect only hypothetical records. Verify both addition choices fit at 320px and 390px, with no horizontal overflow or overlay on bottom navigation.

## Idempotence and Recovery

All records stay in browser storage under the existing key. Existing daily records without a start day count on their end day. Repeated imports update identities instead of duplicating. Clear and individual removals remain undoable. Browser checks must remove synthetic records through the UI before finishing and leave original user tabs untouched.

## Artifacts and Notes

Original regression command produced 1 failed, 15 passed. The final 390px browser proof is /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/planner-projection-refinement.jpg. The document width was 390px, matching its viewport. At 320px, picker layout and confirmation action-bar scroll widths both measured 320px after the shared layout fix. Temporary tabs and viewport overrides were cleaned up.

## Interfaces and Dependencies

PlannerFinish adds source manual and optional tryDay (YYYY-MM-DD). ProjectedStep continues to expose stage/id/tasks/mushrooms/finishes/pastCount/presumedComplete. projectStages returns rows, with no unassigned category. ScreenshotDraft no longer needs targetId. SimpleDateTimeInput accepts error/helperText for shared validation. Use existing MUI, Dayjs, and Intl; no new dependencies.

Plan created 2026-10-30 to implement the user's corrected projection semantics and consistency requests.

Plan revised 2026-10-30 after browser verification and cross-region testing: retain independent start-day allowance, constrain the shared mobile picker, and preserve existing user records during cleanup.
