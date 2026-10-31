> Follow-up: the user subsequently authorized removing the legacy timeline/provider, unused FullCalendar/Base UI packages, and adding a root README. These are now complete. The later UX implementation and validation are recorded in [planner-usability-implementation.md](planner-usability-implementation.md); the review below describes the earlier component-reuse pass.

# Repository reuse and maintenance review

Reviewed October 30, 2026. This document describes source refactoring and the remaining maintenance findings. The separate [UX review](/Users/adechen/Projects/pikmin-bloom/docs/ux-review.md) contains suggestions only. Calculator styling is the reference; this work does not implement that review's design recommendations.

## What changed

| Shared module | Where it is reused | Why it earns a shared interface |
| --- | --- | --- |
| [CountdownFields](/Users/adechen/Projects/pikmin-bloom/src/CountdownFields.tsx) | Running calculator, manual battle addition, screenshot review | One definition of integer input, unit order, valid field ranges, calculator sizing, responsive grid, and grouped editing focus. Callers retain their null/zero, snapshot and validation policies. |
| [MushroomTypeField](/Users/adechen/Projects/pikmin-bloom/src/MushroomTypeField.tsx) | New-battle calculator, planner editor, hypothetical form, import review, legacy preset form | Explicit preset-object and custom-string variants reuse the same domain field. Known presets carry health/AP metadata; custom event names are never coerced into a guessed preset. |
| [useScreenshotReader](/Users/adechen/Projects/pikmin-bloom/src/useScreenshotReader.ts) | Calculator autofill and planner batch review | One queue lifecycle handles local reading, progress, per-file timeout, cancellation, superseding requests and unmount cleanup. Callers decide whether successful results fill immediately or remain drafts. |
| [ScreenshotFileInput](/Users/adechen/Projects/pikmin-bloom/src/ScreenshotFileInput.tsx), [ScreenshotReadingStatus](/Users/adechen/Projects/pikmin-bloom/src/ScreenshotReadingStatus.tsx) | Both import flows | Accepted formats, same-file retry reset and progress presentation now have single definitions. Single-file vs batch selection remains explicit. |
| [formStyles](/Users/adechen/Projects/pikmin-bloom/src/formStyles.ts), [pickerStyles](/Users/adechen/Projects/pikmin-bloom/src/pickerStyles.ts) | Calculator, running snapshot, planner date/time and start-day fields | Calculator spacing and responsive picker layout are reused without introducing another UI framework or a broad wrapper around MUI. |
| [plannerRecords](/Users/adechen/Projects/pikmin-bloom/src/plannerRecords.ts) | Manual edits/additions and screenshot imports | Normalized name/type matching now belongs to a shared battle-record module rather than the screenshot import file. Existing update rules and distinct hypothetical records are preserved. |

The existing [NumberSpinner](/Users/adechen/Projects/pikmin-bloom/src/NumberSpinner.tsx), [SimpleDateTimeInput](/Users/adechen/Projects/pikmin-bloom/src/SimpleDateTimeInput.tsx), [DiscordTimestampField](/Users/adechen/Projects/pikmin-bloom/src/DiscordTimestampField.tsx), and [JoinPlanner](/Users/adechen/Projects/pikmin-bloom/src/JoinPlanner.tsx) already provide useful reuse. They remain the reference rather than being replaced with competing primitives.

Moved the existing planner editor into [PlannerFinishEditor](/Users/adechen/Projects/pikmin-bloom/src/PlannerFinishEditor.tsx), keeping transient form state separate from timeline allocation and storage. Moved the unchanged application theme into [theme](/Users/adechen/Projects/pikmin-bloom/src/theme.ts), so [App](/Users/adechen/Projects/pikmin-bloom/src/App.tsx) concentrates on layout/providers and keyboard behavior. These separations are for ownership and navigation, not extraction of arbitrary JSX fragments.

## Areas reviewed and intentionally retained

| Area | Assessment |
| --- | --- |
| App shell, navigation and keyboard | App, View, useMobileKeyboard and index.css coordinate safe areas, keyboard visibility, mounted drafts and per-destination scroll state. Keep these cross-cutting responsibilities explicit; do not collapse them into a generic card wrapper. |
| New-battle and running-battle calculations | mushroomCalculator and helpers already centralize calculation rules with substantial regression coverage. The two modes have different inputs and time references, so a single universal battle form would make its interface harder to understand. |
| Additional-player planning | JoinPlanner is reused by both calculator modes. Its AP/time calculations already use shared pure functions. No duplicated second join planner is needed. |
| Planner projection and daily hypotheses | stagePlanner and hypotheticalTries separate allocation, event-month inference and known start-day counting from rendering. DailyTries remains a focused owner of hypothetical entry state. No allocation policy was changed in this refactor. |
| OCR, metadata and image parsing | readBattleScreenshot, screenshotImage and screenshotParsing already separate local OCR orchestration, image/metadata handling and text parsing. UI cancellation/timeout duplication was the additional useful shared seam. |
| Clock editing | Browser-local Dayjs values and planner wall clocks resolved in a selected IANA timezone represent different concepts. Reuse picker appearance, but retain WallClockProvider and explicit repeated/skipped-clock handling rather than blindly sharing parsing. |
| Persistence and identity | Browser storage schema/key, record IDs, import freshness and deduplication semantics remain intact. No migration or legacy-data deletion. |
| Theme and layout | Existing dark MUI theme and calculator field geometry remain authoritative. Calendar countdown density now follows the calculator on desktop as well as phones. Other labels, hierarchy and navigation were not redesigned. |
| Tests/tooling | Existing calculation, DST, import, projection, navigation and handoff tests remain behavioral contracts. New reader tests target actual asynchronous races and cleanup rather than mirror JSX. No dependency or package-lock changes were introduced by this review. |

## Remaining maintenance findings

1. **An old application subtree remains in the repository.** [Timeline](/Users/adechen/Projects/pikmin-bloom/src/Timeline.tsx), EventList, MoreInfo, DateMonogram and MushStages have no route from current View. However, [MushroomProvider](/Users/adechen/Projects/pikmin-bloom/src/Provider.tsx) still mounts at startup and reads/writes the separate legacy storage key through useMushroomTries. Confirm the intended compatibility/migration policy before retiring that subtree and provider. Do not silently conflate it with the current stage planner.
2. **Dependencies contain candidates for a deliberate cleanup.** Source inspection found no active imports of FullCalendar or Base UI despite entries in [package.json](/Users/adechen/Projects/pikmin-bloom/package.json). Confirm build/script references and remove them in a separate dependency cleanup with a clean build, rather than bundling package churn into UI reuse.
3. **The repository lacks a root README.** A short developer guide should map the current entry points, explain the two time representations and local OCR assets, list check commands, and identify legacy files. That would reduce the chance of maintaining the unused timeline as if it were the current planner.
4. **Broad names hide ownership.** helpers.ts contains substantial battle math, while stagePlanner.ts also owns clock resolution and storage validation. They are small enough to retain for now, but future expansion should separate by responsibility, not add another catch-all utility module. No speculative interface layers were added here.
5. **Small formatting differences do not all justify shared modules.** The two local AP formatting helpers use different string/locale presentation. Date-only, full precise timestamps and shorter row timestamps likewise have different roles. Extract a formatter when a shared formatting policy is chosen; do not standardize them by accident during a mechanical refactor.
6. **The new shared reader makes async safety local, but browser integrations still deserve regression coverage.** Unit and component tests now cover canceled, replaced, timed-out and unmounted reads. A future browser test harness should automate a real OCR file, mobile date-picker interaction and calculator/planner round trip. Manual responsive checks here do not substitute for physical iOS/Android keyboard or screen-reader testing.

## What was deliberately not changed

No new UX features, shortened copy, active-task model, sleep/collision analysis, event eligibility logic, month controls, onboarding, notifications, storage migration, automatic date behavior or clipboard/update policy was implemented. Those belong to the independent recommendations. No records were removed, no screenshots modified, and no commit or deployment was made.

## Validation

All 243 tests in 25 suites pass (238 existing tests plus five new shared-reader lifecycle tests). TypeScript, ESLint, production build, and git diff --check pass. New tests cover partial batches, cancellation with late results/progress, replacement requests, timeout, and unmount cleanup.

Browser inspection verified the unchanged desktop calculator preset/derived-result styling, real screenshot autofill at 390 px, successful two-file Calendar reading and matching review at 320 px, manual editor reflow, and the shared start-date picker with reachable OK/Cancel. Calendar document and viewport widths were both 320 px. Saved user records were preserved; temporary review forms were cancelled and the task-created browser tab closed after resetting viewport overrides. These are desktop-browser responsive checks, not physical phone keyboard or screen-reader certification.

Proof images: [calculator](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-calculator-desktop.jpg), [shared countdowns](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-countdown-calculator-mobile.jpg), [manual editor](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-manual-320.jpg), [batch review](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-import-review-320.jpg), [date picker](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-date-picker-320.jpg). The pre-refactor source snapshot is /private/tmp/pikmin-reuse.zLa5Gi/src, allowing this task's changes to be reviewed separately from the substantial existing uncommitted work.


## Final reuse check — October 30, 2026

The current implementation no longer contains `pickerStyles`: pickers use default MUI styling and device selection. `SectionAccordion` shares disclosure, headings and panel links; `ResponsiveDialog`, `PlannedTryFields`, `FilePickerButton`, `PlannerTimeField`, `ActionFeedback` and the existing domain controls cover their repeated behaviors. `useTabScrollRestoration` now handles capture/restoration for both main mobile navigation and planner tabs. Unused numeric steppers/hidden labels, countdown focus callbacks and the start-date timezone prop were removed. No new dependencies were introduced.

The final scan found no remaining repeated production TSX block of ten significant lines that justified extraction. This does not prove all semantic duplication absent; source inspection also checked the two calculators, both screenshot flows, planner entry/editing, date resolution, field validation and feedback. Keep the different date/time meanings explicit, and avoid broad universal-form or universal-picker wrappers. The remaining recovery/tab-panel accessibility opportunities and UX recommendations are recorded in the final section of [the follow-up review](ux-review-follow-up.md#final-mui-review--october-30-2026).
