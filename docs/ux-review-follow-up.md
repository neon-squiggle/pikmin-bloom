# Planner UX review — October 30, 2026

This is a fresh review of the current app, using the player's rollover objective as the basis for prioritization. Earlier recommendations were not used as a checklist. Findings below are suggestions, not implemented changes. This pass implemented only the requested checkbox and behavior-preserving reuse described in [component-reuse-follow-up.md](component-reuse-follow-up.md).

## User intent and scope

Players spend otherwise-unused daily attempts on battles that end during the next event. They need to see actual calendar end times, distribute endings across event tasks, notice potentially wasted task transitions, and account for future free starts. Twenty endings in one day is realistic. The planner is a reference: time passing implies completion, and users correct mistakes themselves.

The review accepts the existing product decisions: no readiness gates or completion confirmations; no general sleep markers; all steps remain available for orientation; primary/secondary names without assumed colors; editable past and missed mushrooms; optional start information; more than three hypothetical tries allowed; no game tutorial, live clock, all-months dashboard, archive, or sample defaults. Precision within a few minutes is adequate. These are not findings to reverse.

Reviewed surfaces include both calculators and their additional-player section, navigation, stage and end-time views, manual and hypothetical forms, screenshot review, month/timezone preferences, recovery, shared fields, and responsive dialogs. Source inspection covered their state/storage, identity, time resolution, OCR queue, feedback, and keyboard/layout helpers. Existing calculation and DST tests were retained.

Browser checks used desktop 1280 px, mobile 390 px, and a 320 px dialog. A temporary plan with 20 November 2 endings included running battles, planned tries, an extra try, a known calculated start, and sleep/gap risks. Two real attached screenshots were read without saving. The saved plan was exported before testing and restored afterward; the additional cross-month test entry was undone. The original three records and preferences remain. This is an expert inspection, not a user study, physical-device keyboard certification, or full accessibility conformance audit.

Priority: **P1** obstructs a core flow or can silently produce an unintended record; **P2** creates avoidable confusion, navigation effort, or recovery risk. Browser observations and source-based inferences are distinguished below. The organizing principles are visibility, error recovery, user control, recognition, and economy of presentation from [Nielsen's heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/); the recommendations are judgments about this app, not requirements imposed by that source.

## Findings

### 1. P1 — A successful save can leave the new mushroom invisible

**Observed:** With the existing October plan visible, adding a hypothetical ending November 2 showed “Try added” and changed the October 30 start chip from 0/3 to 1/3. The schedule still contained the same three October mushrooms. The month header stayed October, so there was no visible way to inspect the newly added record without finding the month setting. This is especially confusing during the main rollover workflow.

**Evidence:** [MushroomPlanner.tsx](/Users/adechen/Projects/pikmin-bloom/src/MushroomPlanner.tsx:29) filters records by the selected/inferred month, while add/save feedback is month-agnostic.

**Suggestion:** Preserve the chosen month policy, but make a save outside the visible month offer a short contextual action such as “View November.” For a batch spanning months, provide an appropriate destination after saving. This can be transient feedback; it does not require another dashboard or explanatory paragraph.

### 2. P1 — Invalid start dates become absent dates

**Observed:** Entering `11/99/2026` in a hypothetical try's Start date cleared the input to its empty placeholder. `aria-invalid` became false and Add try remained enabled. Since an absent start date is permitted, the next record could lose its intended free-try attribution without an error.

**Evidence:** [PlannerTryDateField.tsx](/Users/adechen/Projects/pikmin-bloom/src/PlannerTryDateField.tsx:12) emits the same empty value for an invalid date and an intentional clear. [DailyTries.tsx](/Users/adechen/Projects/pikmin-bloom/src/DailyTries.tsx:28) permits an empty date. The same date field is reused in planned-mushroom editing.

**Suggestion:** Keep intentionally blank start dates valid, but retain invalid drafts until corrected or explicitly cleared. Show a short field error and prevent the pending add/save while the visible date is invalid. This should follow the numeric fields' existing rule of preserving invalid input. [W3C error identification guidance](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) supports identifying the affected field and explaining an error in text.

### 3. P1 — File actions need verified keyboard activation

**Observed:** Focusing Import plan and pressing Enter did not open a file chooser in the review browser. A pointer click on the same unobscured control did. This can block restoring a plan for keyboard users.

**Evidence:** [PlannerSettings.tsx](/Users/adechen/Projects/pikmin-bloom/src/PlannerSettings.tsx:42) renders a button as a label around a hidden file input. Similar patterns exist in [BattleScreenshotUpload.tsx](/Users/adechen/Projects/pikmin-bloom/src/BattleScreenshotUpload.tsx:32) and Add more screenshots. Their keyboard behavior is a source-based concern, not separately claimed as browser-confirmed here. The main planner upload menu uses an explicit input trigger and is a different path.

**Suggestion:** Prefer native buttons that activate the file input under a user gesture, or a correctly focusable file-input pattern. Verify Enter and Space, the chooser, cancellation, and returning focus for every file entry point. [W3C's button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) describes expected activation, and [keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) explains equivalent access to pointer actions.

### 4. P2 — Screenshot review can identify the wrong field to correct

**Observed:** After reading two screenshots successfully, setting the first countdown to all zeros disabled Save and displayed “1 screenshots need review.” None of the countdown fields had an error or an explanation. Clicking Review focused the valid Title field rather than the countdown.

**Evidence:** [CalendarScreenshotUpload.tsx](/Users/adechen/Projects/pikmin-bloom/src/CalendarScreenshotUpload.tsx:24) requires a positive aggregate duration. Its Review action falls back to the first input when no input is marked invalid. [Screenshot proof](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/ux-review2-countdown-error.jpg).

**Suggestion:** Add a contextual group-level error such as “Enter time remaining” and move Review to that group. Individual zero units are valid; the aggregate is the issue. Required-title feedback also appeared immediately on opening the manual dialog before typing, so check focus/blur timing alongside this work. Use the same interaction rule across forms: routine labels first, actionable errors after a relevant interaction.

### 5. P2 — Recovery feedback covers the information being reviewed

**Observed:** The persistent mobile Undo banner covered schedule content after importing the dense plan. The floating Add action and bottom navigation occupy further space underneath it. The banner's persistence is useful when inspecting many records, but it has no visible dismiss action. Escape dismisses it for keyboard users.

**Source-confirmed:** Changing any planner preference calls `setUndo(null)`, so adjusting a display/timing setting can remove recovery for a preceding record deletion or replacement.

**Suggestion:** Keep recovery available without covering the schedule. An inline one-line status row with Undo is one option. If retaining a floating message, give it a visible dismissal path and reserve sufficient scroll/focus clearance. Preference edits should not silently discard record recovery unless another record operation supersedes it. This is a focus-visibility risk to test, not a blanket conformance finding; [W3C focus-not-obscured guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) addresses overlays and sticky content.

### 6. P2 — A crowded day loses its date context while scrolling

**Observed:** The 20-row end-time list measured 2,363 px at 390 px width. Its date appeared once at the top of the group. After scrolling, rows displayed times without the day's heading in view. End times are the right primary content, but users comparing several crowded days must remember which date they are reading.

**Evidence:** [MushroomPlanner.tsx](/Users/adechen/Projects/pikmin-bloom/src/MushroomPlanner.tsx:88) uses ordinary day headings; [PlannerFinishRow.tsx](/Users/adechen/Projects/pikmin-bloom/src/PlannerFinishRow.tsx:19) hides each row's date in the End times view. [Dense-plan proof](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/ux-review2-dense-mobile.jpg) uses temporary review data, since removed.

**Suggestion:** First try sticky day headings with an opaque background and correct focus/scroll offsets. Preserve title, type, time, and relevant status. Then assess modestly tighter row spacing with users before adding a density setting or hiding metadata. Repeating the date in every row would cost space; keeping the group context visible is the smaller intervention.

### 7. P2 — A new hypothetical try can start with an already-ended default

**Observed/source-confirmed:** The daily form defaults to noon on today when the visible event month is current. During an afternoon review it therefore offered today's noon with Add try enabled. Saving unchanged would immediately create an ended hypothetical record and could affect inferred task completion.

**Evidence:** [DailyTries.tsx](/Users/adechen/Projects/pikmin-bloom/src/DailyTries.tsx:20) chooses the default clock independently of the current hour.

**Suggestion:** For a new projection, choose a useful future default, for example a nearby whole hour or a future date in the planned event month. Continue allowing users to edit past records; this is a default-value issue, not a request to ban historical corrections, introduce a live clock, or add precision warnings.

### 8. P2 — Batch timeout recovery does not retain the remaining queue

**Source-based inference, not a manually waited 90-second browser test:** A file timeout aborts the shared batch controller. The loop then stops, and later files are not attempted. Completed drafts survive, but there is no retained list/action to retry only the pending files. With 34 uploads, users may have to reconstruct which screenshots remain.

**Evidence:** [useScreenshotReader.ts](/Users/adechen/Projects/pikmin-bloom/src/useScreenshotReader.ts:39) and its timeout at line 53. Existing tests cover cancellation and timeout isolation, not a user-facing pending-queue recovery flow.

**Suggestion:** Retain pending files for a compact “Retry remaining” action, or clearly identify the remaining count when a timeout stops a batch. Keep per-file successes. This concerns unattempted uploads after a reader failure; it does not reinstate stale-capture warnings or discrepancy notices the product intentionally omits.

## Lower-priority consistency checks

- An incomplete optional sleep range currently has no effect, with no indication that it is incomplete. A contextual message after entering only one endpoint would clarify the setting without adding routine help.
- Invalid minimum-gap input is displayed as invalid but persisted as zero by its caller. Retaining the last valid preference until correction would avoid temporarily changing timing warnings while editing an invalid value. This is source-confirmed; it was not changed.
- A manually entered hypothetical defaults to the title Daily mushroom; multiple such entries remain distinguishable mainly by time/type. The existing title editor is sufficient for now. Do not add location requirements or force users to name every hypothetical try merely to make rows unique.

## What is working and should remain

The chronological view matches the planning task. The Stages view keeps non-mushroom requirements available for orientation. Type stays visible. Status badges now share placement and geometry; amber warns only at risky task changes, and rapid finishes within one task remain unmarked. Past entries stay editable. Free-start chips, extra tries and end-only entries preserve the intended flexibility.

Calculator modes and planner tabs have different roles and can legitimately use different controls. Additional-player planning is optional and collapsed. Numeric fields preserve invalid text instead of changing its meaning. Clipboard failures expose selectable text. Updates offer Reload rather than replacing drafts automatically. These do not need a redesign merely for visual sameness.

MUI provides a sound default system; it is configurable, not an instruction to keep every visual default. For this app, sentence case is a hierarchy preference: it matches surrounding labels and lets times and mushroom details carry emphasis. It is not a claim that uppercase controls are inherently unusable. [Google's capitalization guide](https://developers.google.com/style/capitalization) favors restrained capitalization, while [MUI typography](https://mui.com/material-ui/customization/typography/) supports centralizing the choice. Numeric labels remain above inputs by the user's explicit choice. The new filter uses MUI's ordinary labeled checkbox with a stable label and a visible checked state; no custom checkbox skin was introduced.

## Suggested sequence

Address saved-item visibility and invalid-date recovery first, then file-action keyboard access and actionable countdown errors. Next improve recovery placement and sticky day context. Finally adjust new-projection defaults and partial-batch retry. Validate these changes against the same dense-month rollover scenario. Do not add game explanations, readiness models, extra status categories, or completion chores to solve these interaction problems.


## Follow-up implementation status

The user accepted findings 1–5, 7 and 8 and skipped finding 6. The resulting changes and verification are documented in [planner-review-fixes.md](planner-review-fixes.md). For finding 2, the user clarified the desired behavior: disable invalid days using MUI date bounds, rather than relying on a separate ordering message. The shared planned fields now constrain both calendars and use MUI's validation callbacks. The same name/type wording identifies a single mushroom with an updated countdown. Uncalibrated OCR confidence warnings were removed. The non-mushroom filter was removed and Planned entry is available from Add mushrooms. These implementation decisions supersede the corresponding suggestions above; this report otherwise remains the historical pre-change review.


## Final MUI review — October 30, 2026

This section supersedes older findings where the application has since changed. Scope: current calculator modes, additional players, planner views, screenshot/manual/planned entry, daily accounting, Settings, feedback, keyboard access and responsive layout. Source review was checked against current official MUI documentation; installed dependencies remain Material UI 7 and MUI X 8. This is an expert review, not a user study or a claim of accessibility conformance.

### Completed alongside this review

Stages and End times retain independent scroll positions. First visits show today's mushrooms, or the top when there are none. The shared `useTabScrollRestoration` hook also replaces the separate mobile Calculator/Planner restoration implementation, retaining reselect-to-top and calculator handoff behavior. Card and page offsets are separate. Month, timezone and local-day changes initialize a new planner context. The responsive time picker and its mobile analog clock remain unchanged.

Unused numeric stepper/hidden-label modes, countdown editing callbacks and a start-date timezone prop were removed. The existing domain controls, reader queue, file buttons, form geometry, dialogs, accordions and feedback remain shared. An exact-block scan found no repeated production TSX blocks of ten significant lines worth extracting. Similar-looking date controls intentionally retain different data meanings: browser instants, planner-zone wall clocks and recurring sleep times. A universal date wrapper would obscure those distinctions.

### Remaining recommendations (not implemented)

1. **P2 — Review can focus the wrong control after a picker error.** Screenshot review's recovery selector still searches `input` elements. The accessible MUI picker uses visible spinbutton sections and a hidden form input. Capture-time recovery should focus the affected visible picker section, while countdown recovery should continue to focus Days. This is a source finding; the existing countdown-focus test covers only numeric inputs. See `CalendarScreenshotUpload.tsx`, the Review action. [MUI's field DOM migration](https://mui.com/x/migration/migration-pickers-v7/#new-dom-structure-for-the-field) documents the distinction.
2. **P2 — Warning reasons are difficult to discover.** “May be missed” is a non-focusable status chip with the reason in a tooltip. The chip is visible on both desktop and phone, but keyboard users cannot focus it; touch users must discover a long press. Make that explanation available through a focusable, tappable control without adding permanent schedule text. This is a source-based accessibility finding, with the current chip visually observed. [MUI tooltips](https://mui.com/material-ui/react-tooltip/#triggers) default to a 700 ms touch delay.
3. **P2 — Clear daily tries understates its scope.** The accounting surface looks informational, but its Clear action deletes all hypothetical mushroom records, including named/planned mushrooms. It is not just resetting counters. Prefer “Remove planned mushrooms” and make the intended scope explicit; retain Undo. Source confirms the deletion scope; the action was not executed during this audit.
4. **P2 — Complete the entry-tab accessibility links.** The editor's inactive tab points to a panel ID that is absent, and planner panels begin with meaningful headings that are not focusable but lack `tabIndex={0}`. Use stable panel associations and an appropriate keyboard entry point. A small shared TabPanel would be justified if it replaces this behavior in multiple places; do not wrap Tabs solely for cosmetic uniformity. [MUI tab guidance](https://mui.com/material-ui/react-tabs/#accessibility) covers both relationships and focusable panels.
5. **P3 — Narrow stage headers are cramped.** At 320 px, Step 1–4's task description wraps into several short lines beside the quota and Complete text. Keep the useful right-aligned count, but allow the task description a full-width row at the narrowest sizes. Observed in the browser; 390 px and desktop remain more readable.

The existing prominent Add action, lower-emphasis copy actions, modal editing, default accordion disclosure, grouped settings and single temporary feedback surface fit MUI's documented component roles. [FABs](https://mui.com/material-ui/react-floating-action-button/) represent a primary screen action; [snackbars](https://mui.com/material-ui/react-snackbar/) provide temporary process feedback. The two-destination mobile navigation remains an explicit product choice. MUI does not prescribe scroll restoration policy or this app's labels.

### Timing copy (approved and applied)

Section: **Timing warnings**

“Flags mushrooms that may end before you can claim the previous task’s reward and reach the next mushroom task. Checks sleep hours and the minimum time between tasks separately.”

This describes two independent checks. Ending during sleep alone is not sufficient for a warning: a player may already have reached the applicable task. The minimum uses full elapsed time, not awake minutes. Simultaneous endings across task boundaries are also warned even with no configured minimum.

### Validation and limits

All 332 tests in 41 suites passed, plus TypeScript, ESLint, production build and diff checks. A subsequent test-only JSDOM scroll mock adjustment was verified with all seven View tests passing. Browser checks used desktop 1280 px and mobile widths 390 and 320 px. Direct pointer switching restored exact scroll offsets (desktop 632 px; phone 824 px), including after Calculator/Planner navigation. Locator clicks can themselves scroll controls into view before clicking, so direct pointer interaction was used to distinguish automation movement from app restoration. No saved mushroom or preference was changed. The mobile layout was inspected in a desktop browser viewport; physical-device keyboards and touch picker interaction were not newly tested. The analog clock remains the installed MUI default.
