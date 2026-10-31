# Improve mobile editing and Calendar screenshot entry

This ExecPlan follows the execution-plan skill. It is a living specification; Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective describe the final authorized scope.

## Purpose / Big Picture

Users need bottom calculator fields to remain visible with the software keyboard, without a permanent large blank area. Calendar needs a prominent local screenshot-import flow. Hypothetical daily finishes belong below the tasks and must be easy to clear and restore. The per-mushroom count checkbox must disappear. Separately, the user requested an exploration of https://softspot.nl/pikmin/mushroomtimers/ and a usefulness ranking for saving daily attempts as battles that finish in the next event month.

The user explicitly clarified that examining the other app is research only. No month-management, task-readiness, repeated-round, labeling, transfer, or other reference-derived feature is authorized for implementation in this task. The existing stage assignments remain projections; a passed finish does not prove that the real flower/growth tasks were cleared.

## Progress

- [x] 2026-10-30: Inspect the current app and the reference tool's visible help and controls.
- [x] 2026-10-30: Record a ranked audit in docs/mushroom-timer-feature-audit.md, separating observations from recommendations and unverified behavior.
- [x] 2026-10-30: Add visible-viewport keyboard handling, active-field scrolling, modal resizing, and navigation/FAB hiding during keyboard editing.
- [x] 2026-10-30: Remove next-field scrolling that competed with retaining the active input in view.
- [x] 2026-10-30: Add local batch screenshot extraction and review, editable capture/countdown/title/type fields, update matching, stale-observation protection, cancellation, and per-file failures.
- [x] 2026-10-30: Move daily tries below tasks, add batch Clear/Undo, and remove the per-mushroom count control.
- [x] 2026-10-30: TypeScript, ESLint, 210 tests, and production build pass. The five original PNGs read all countdowns/types/capture times; four titles read correctly and one German title was flagged for review. Correcting that title and saving produced 0 added / 5 updated.
- [x] 2026-10-30: Browser daily Clear/Undo restored a two-record batch and preserved all five real records. Mobile FAB/navigation spacing verified at 390px.
- [x] Final narrow-screen proof screenshot and browser cleanup.

## Surprises & Discoveries

The reference explicitly describes next-month preparation. Its autofill workflow pastes Android Circle to Search text; a direct image-upload flow was not found in the inspected controls. Many features are behind icon tabs under the gear. A repeated-round stage-position selector is disabled while event tasks are hidden.

The first broad title crop performed poorly. Detecting aligned bright glyph components inside the upper capsule improved four sample titles to exact readings. The German name Die trauernde Frau remains a low-confidence spelling that needs review; no place-name correction is hardcoded. Countdown, type, and metadata extraction succeeded for all five samples.

Native datetime-local fields can serialize whole seconds with .000. The timezone resolver now accepts that representation; a missing-metadata import test caught and verifies this behavior. The keyboard hook distinguishes layout resizing from visual-only overlap, so keyboard clearance is not counted twice.

## Decision Log

2026-10-30, Codex: Use a labeled photo-plus extended floating action on phones and a header button on desktop. This implements the user's acceptance of the previously proposed screenshot entry point.

2026-10-30, Codex: Require review before saving a screenshot batch. Missing capture time must be supplied manually; upload time is not used as a capture substitute. Match by normalized title and type, allow an explicit existing battle or new battle, and skip older observations when newer capture metadata exists.

2026-10-30, user clarification: Research must not trigger feature implementation. Prospective month-scoped allocation and readiness controls were removed before completion. They remain recommendations only in the audit.

2026-10-30, Codex: Remove the per-record count boolean from the active model. Its old persisted value is ignored; existing records are preserved. Keep stage assignments explicitly labeled as projections, without pretending to solve blocked-task timing.

2026-10-30, Codex: Implement only one reversible daily batch-clear action. It preserves screenshot records, and Undo restores the removed batch without overwriting subsequently added records.

## Outcomes & Retrospective

The authorized implementation is complete, including the final narrow-screen screenshot and browser cleanup. No deployment or commit was requested; preserve the shared checkout's earlier uncommitted work. No user screenshots were sent to the reference site or an external OCR service. Physical iPhone/Android keyboard behavior still requires real-device validation; viewport unit tests and responsive browser sizes do not establish that physical result.

## Context and Orientation

The repository is /Users/adechen/Projects/pikmin-bloom. src/View.tsx switches Calculator and Calendar and owns the mobile navigation. src/App.tsx owns page spacing. src/useMobileKeyboard.ts measures the keyboard-adjusted visible area, reserves only actual overlap, and reveals the active editable control. src/index.css resizes modal containers while the keyboard is present.

src/MushroomPlanner.tsx renders Calendar, persists records, and owns daily Clear/Undo. src/CalendarScreenshotUpload.tsx provides the responsive entry point and review dialog. src/calendarScreenshotImport.ts handles identity matching and merging. src/readBattleScreenshot.ts uses local Tesseract assets prepared by scripts/prepare-ocr.cjs; src/screenshotImage.ts finds stats and title glyphs at relative image positions. src/stagePlanner.ts retains the sixteen event tasks, projection, persistence, and IANA timezone conversion. Existing screenshots seeded by src/screenshotMushrooms.ts assumed America/Los_Angeles for capture times without offsets.

## Plan of Work

The implementation uses the existing React, MUI, exifr, Tesseract, and Intl dependencies. VisualViewport resize/scroll and focus events update temporary keyboard clearance; page scrolling and nested dialog scrolling use the active control's actual bounds. A physical keyboard without viewport shrink does not hide navigation. Pinch zoom is not treated as a software keyboard.

Screenshot files are processed sequentially, with a cancellable reader and a per-file timeout. The review retains successful reads alongside file errors. All title/type/capture/countdown values are editable, seasonal names are free text, and DST gaps or repeated local clocks are resolved by the existing timezone field. Review rows can be skipped. Saving is blocked for incomplete or ambiguous records. No remote OCR service is introduced.

The feature audit is a separate Markdown artifact and has no runtime connection to the app. Its recommendations intentionally remain unimplemented following the user's scope clarification.

## Concrete Steps

From /Users/adechen/Projects/pikmin-bloom run npx tsc --noEmit, npm run lint, CI=true npm test -- --watchAll=false --runInBand, npm run build, and git diff --check. Current results are no TypeScript/ESLint errors, 210 passing tests in 20 suites, and a compiled production build. Keep the task-owned preview at http://127.0.0.1:3000/ running for the user.

## Validation and Acceptance

On a phone-sized Calendar, Add screenshots floats above the bottom navigation; on desktop it appears beside the planner heading. Choose the five original PNGs from /Users/adechen/Downloads, verify four exact titles and one flagged German spelling, correct the flagged title, and save. The notice should read 0 added / 5 updated, with the original five finish instants unchanged.

For missing metadata, Save remains disabled until a valid capture time and countdown are supplied. A failed file must not discard successful review rows or modify saved data. Re-importing an observation updates by identity rather than doubling it, and older known observations cannot overwrite newer ones.

Add hypothetical daily tries, clear them, and use Undo; screenshot records remain. More than three tries remain allowed with an x/3 indicator. The count checkbox is absent from the mushroom editor. In tests, simulate visual viewport shrink with and without layout shrink, a panned viewport, input switching, dismissal, and pinch zoom. Extra keyboard clearance restores to zero after dismissal. Verify narrow widths and save a clean screenshot; real-device keyboard testing remains a stated limitation.

## Idempotence and Recovery

Existing records are preserved. Screenshot review is cancellable before saving. Daily clearing and removal are reversible with Undo. Restore synthetic browser test records through the UI before finishing. Do not upload user screenshots to the reference site, use its clipboard actions, send messages, or change its persistent settings. Only navigate its visible local views for research.

## Artifacts and Notes

The full ranked research artifact is docs/mushroom-timer-feature-audit.md. Save the final phone screenshot under /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5 and embed it in the final reply. Browser verification of the source batch reported 0 added / 5 updated; daily clearing reported 0 hypothetical rows followed by 2 after Undo.

## Interfaces and Dependencies

PlannerFinish keeps id, title, type, endAt, source, and optional capturedAt/filename. ScreenshotDraft adds editable countdown and an update target. mergeScreenshotDrafts returns finishes plus added/updated/skipped counts. useMobileKeyboard(enabled) returns open and bottomInset. Capture/finish instants are UTC strings; finishTimeCandidates/localDateTime convert IANA wall clocks and preserve elapsed countdown behavior across DST. No new runtime dependency is required.

Plan revised 2026-10-30 after the user clarified research-only scope, and updated with actual implementation and validation evidence.
