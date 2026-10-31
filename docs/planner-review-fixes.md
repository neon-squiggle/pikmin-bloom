# Make planner entry and recovery reliable

This living ExecPlan follows the execution-plan skill. Keep Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective current.

## Purpose / Big Picture

Players use this React planner to project when mushroom battles end and how those ends fill event tasks. They should be able to add a planned try from the floating Add mushrooms action, recover unfinished screenshot reads, correct invalid input, and undo a record change without losing subsequent preference edits. The same name and type identifies one running mushroom: a newer observation updates its countdown and end time.

## Progress

- [x] (2026-10-30) Read the accepted follow-up review, source, and existing tests. Preserve the existing uncommitted application and local server.
- [x] (2026-10-30) Implement MUI date limits, native keyboard file actions, future defaults, and removal of the non-mushroom filter.
- [x] (2026-10-30) Implement pending-file recovery, actionable countdown errors, and wording that same name/type identifies one mushroom.
- [x] (2026-10-30) Implement inline Undo, View month feedback, and Planned entry with shared planned fields.
- [x] (2026-10-30) All 252 tests, TypeScript, ESLint, production build and diff checks pass.
- [x] (2026-10-30) Verify real-image review, zero-countdown focus, keyboard Add more, stop/close/resume/retry, responsive dialogs, and exact restoration of all eight saved records/preferences.

## Context and Orientation

The workspace is /Users/adechen/Projects/pikmin-bloom. src/MushroomPlanner.tsx owns records, month selection, projection, and recovery feedback. src/stagePlanner.ts owns storage parsing and allocation. src/PlannerFinishEditor.tsx edits records; src/DailyTries.tsx adds hypothetical future tries. A hypothetical try has an end time and optional start date, type, and calculated start time; it consumes one free daily attempt unless marked Extra try. Existing running battles use countdown inputs when first added. src/CalendarScreenshotUpload.tsx reviews a screenshot batch and src/BattleScreenshotUpload.tsx autofills the calculator. Both use src/useScreenshotReader.ts. Completed reads must remain while canceled, failed, or not-yet-read files can be retried without selecting them again.

## Decision Log

2026-10-30: Implement follow-up review findings 1–5, 7, and 8. Skip finding 6 (sticky date context). Always show non-mushroom steps; retire the control but accept the old saved preference for compatibility. Preserve calculator styles, sentence case, and numeric labels above inputs.

2026-10-30: Add Planned as a tab in the existing Add mushroom dialog. Keep the bottom daily chip view because it summarizes free attempts. Share the planned end/type/start/extra fields rather than adding a separate field style. Default new planned ends to a future rounded time; editing a past end remains allowed.

2026-10-30: Separate calculated start entries are advice only pending a decision. Recommend an optional schedule display with a Start label; starts never affect stage allocation. Do not add it automatically.

2026-10-30: The same name and type means the same running mushroom. Use that wording, never suggest users select between multiple matching battles. Newest input wins. Hypothetical daily tries remain independent.

## Plan of Work

First fix optional date input so invalid text is preserved and prevents save while an intentional clear remains valid. Introduce a future default helper and reusable planned fields for DailyTries and the editor. Remove the step filter UI and predicate. Use native button file activation, sharing reset/accept behavior across file pickers. Test these behaviors with the existing React Testing Library setup.

Then extend useScreenshotReader to retain unsuccessful and unread files. Retry only pending files, maintaining sequential reads and suppressing stale callbacks. Expose recovery in calculator upload and screenshot review, including after closing/reopening review. Show a countdown group error for absent/zero durations and focus its first input from Review. Keep successful drafts and saved records independent of pending files.

Finally replace the overlay Snackbar with dismissible inline feedback and Undo. A record Undo restores records while preserving preference edits; backup import Undo restores the replaced state, retaining preference edits made afterward. Add a View month action if new records are outside the visible month. Expose Planned in Add mushroom, defaulting ordinary Add manually to In progress, and retain Calculate start time for hypothetical entries.

## Concrete Steps

From the workspace run npx tsc --noEmit, npm run lint, CI=true npm test -- --watchAll=false --runInBand, npm run build, and git diff --check. Focused tests may run first with the same Jest command followed by changed test filenames. Do not deploy or commit. Existing changes belong to the user.

## Validation and Acceptance

The Start date calendar disables dates after the end, and the End time calendar disables dates before the start. MUI handles date errors and partial edits; deliberately clearing an optional start remains valid. A new planned try never defaults to a time earlier today. Enter and Space activate native upload/import buttons. A batch with one successful read and a canceled second read retains the first draft and retries the second and remaining files without duplication. A zero countdown shows Enter time remaining and Review focuses Days. Adding a November mushroom while October is selected offers View November. Changing a preference after a record edit leaves Undo available and undoing the record preserves that preference. Add manually opens In progress and its Planned tab supports Add and Calculate start time. No non-mushroom visibility control remains and all steps display even with old hideOtherSteps data.

In the local browser export the current plan before QA, verify desktop and mobile flows through visible controls, restore the exported plan, reset viewport overrides, and close only tabs created for QA. Keep localhost:3000 running.

## Idempotence and Recovery

Storage remains schema-compatible. Pending screenshots are retained in memory for the current mounted session, not persisted as image bytes. Retrying does not repeat completed files. Undo is one record-operation deep and explicit dismissal clears its feedback. Test fixtures remain outside production defaults. Browser QA must restore the user's exported backup.

## Interfaces and Dependencies

Continue using existing React, MUI, Dayjs, Intl, ResponsiveDialog, PlannerFinishField, CountdownFields, MushroomTypeField, and screenshot reader. No dependencies or services are needed. Shared planned fields take controlled values and callbacks; allocation remains in stagePlanner. The screenshot reader returns pendingFiles alongside reading, progress, readFiles, and cancel, allowing each caller to decide how to present retry.

## Surprises & Discoveries

The optional start DatePicker currently maps both invalid text and a cleared field to an empty string. The reader currently aborts a whole queue after a per-file timeout without retaining pending files. Undo currently disappears on any settings edit and uses a full state snapshot, so restoring it naively would overwrite later preferences.

## Outcomes & Retrospective

The accepted fixes and revised picker requirements are complete. All 252 tests in 29 suites, TypeScript, ESLint, production build and diff checks pass. Desktop plus 390 px and 320 px browser checks passed. Three real images were read without saving; stopping the third, closing review, resuming, and retrying retained the first two drafts. A zero countdown produced a field-group error and Review focused Days. A temporary planned entry and preference edit were undone, and the complete original plan was restored. Exported JSON before and after compares equal (eight records). Separate start entries remain a recommendation, not an implemented feature. No unrelated review suggestions were included.

Revision note: Created after the user accepted numbered findings and clarified that the same name/type is one mushroom with an updated countdown.


2026-10-30 decision update: The user specifically requested native picker constraints, not a separate ordering warning. PlannedTryFields passes the start date as the end picker minimum and the end date as the start picker maximum. PlannerTryDateField uses MUI validation callbacks and retains MUI draft values. Full-string invalid paste normalization remains MUI default behavior; do not claim custom raw-text preservation. Remove the prior separate ordering sentence. OCR confidence thresholds were not calibrated for arbitrary names; remove all soft confidence warnings and retain concrete missing/read-failure feedback.

Automated evidence: 29 suites, 252 tests pass; two new calendar tests verify disabled start/end days. Browser evidence so far includes native Enter activation of Import plan, both date limits in the real picker, off-month navigation, preference-preserving Undo, 390 px planned/calculator/return flow, and 320 px dialog layout. The baseline export at /Users/adechen/Downloads/mushroom-plan (3).json contains eight existing records (five screenshot records plus three hypothetical records); preserve all eight. The prior review described only the three October-visible records, not the entire saved store.


Final evidence: /private/tmp/pikmin-review-fixes-final.json and .log contain the 252-test result; /private/tmp/pikmin-review-fixes-build.log records the successful production build. /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/planned-entry-mobile.png shows the new Planned entry dialog at 390 px. The post-QA export /Users/adechen/Downloads/mushroom-plan (4).json is JSON-equal to baseline export (3). No commit, deployment, production seed data or external service was introduced.

Revision note: Completed the accepted implementation, incorporated the user's native-date-limit and OCR-warning clarifications, and recorded automated/browser evidence and restoration.

Final inspection also verified that an unsaved planned draft switched to In progress is saved as a manual running battle, including after returning from the calculator. A regression test covers that source/status transition. Final validation remains green: 29 suites, 252 tests.
