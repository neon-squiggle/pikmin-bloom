# Component reuse follow-up — October 30, 2026

The review covered the current production source and existing tests, rather than treating every similar-looking control as interchangeable. Calculator styling remains authoritative. This pass changes the requested step filter and consolidates repeated presentation behavior; new UX suggestions are in [ux-review-follow-up.md](ux-review-follow-up.md) and were not implemented.

## Applied changes

| Area | Reuse and retained behavior |
| --- | --- |
| Step filter | Replaced the text toggle with MUI Checkbox and FormControlLabel. The label remains Hide non-mushroom steps, checked means hidden, and the existing preference still persists. The label and control are clickable; the row retains a 44 px minimum height and quiet caption styling. |
| Manual editing and screenshot review | Both use [ResponsiveDialog](/Users/adechen/Projects/pikmin-bloom/src/ResponsiveDialog.tsx). It owns full-screen phone behavior, desktop width, accessible title wiring, safe-area title/action spacing, optional form submission, and MUI focus management. Each caller keeps its draft state, validation, save/cancel rules, actions and body. Screenshot review retains its wider desktop size. |
| Compact planner timestamps | [plannerDateTime](/Users/adechen/Projects/pikmin-bloom/src/plannerDateTime.ts) formats the identical month/day/hour/minute timestamps in screenshot summaries, planned-start details and schedule rows. It caches Intl formatters per timezone. Exact timestamps, repeated-DST-clock labels, date-only headings and calculator-local clocks retain their separate roles. |

The dialog module has two real callers. Removing it would put the same responsive, safe-area, semantic and form-shell decisions back into both callers. The timestamp module has three real callers, all using the same presentation policy. Neither introduces a generic configuration system or a speculative dependency.

## Existing reuse retained

| Module | Responsibility |
| --- | --- |
| NumberSpinner | Numeric draft text, validity, bounds, formatting, accessible labels, helper feedback, optional stepping and read-only styling. Numeric labels stay above inputs. |
| CountdownFields and formStyles | Shared countdown units and calculator-authoritative responsive geometry. Callers retain aggregate duration and snapshot policies. |
| SimpleDateTimeInput and pickerStyles | Shared responsive date/time-picker appearance, actions and validation messages. |
| WallClockProvider and planner clock resolution | Explicit selected-IANA-zone wall-clock editing, skipped/repeated-clock handling. These cannot safely be replaced with browser-local calculator date interpretation. |
| MushroomTypeField | Known calculator presets and optional custom planner type entry share presentation while keeping their different value types. |
| useScreenshotReader | One cancellable, timed local OCR queue; late-result and unmount isolation stay local to this module. |
| ScreenshotFileInput and ScreenshotReadingStatus | Shared formats, same-file retry handling and progress presentation. Keyboard activation findings concern the callers' label/button pattern, not OCR parsing. |
| PlannerFinishRow | Both schedule views use the same title/type/time/status/edit presentation. |
| Theme | Sentence-case action typography and shared responsive control/card defaults. No per-page typography redesign. |

## Deliberately not generalized

Calculator segmented mode choices and planner content tabs serve different purposes. Status badges and clickable free-start chips likewise have different roles. Sharing a visual wrapper would obscure those differences.

Start-date fields and the month selector both use the wall-clock picker infrastructure, but serialize different values and handle invalid drafts differently. Merging them before deciding their invalid-input contract would hide a real UX issue; that issue is recorded for a later fix.

The daily form and the existing-mushroom editor share fields, but not save semantics: daily tries create distinct hypothetical records, while existing running mushrooms can replace matching identities and use a countdown for new manual entry. A large shared form with many mode flags would increase the interface callers must understand. Their current field reuse is preferable.

The 126-line planner container still mixes storage/Undo, time refresh and rendering. A future state hook may improve locality if those behaviors grow, but there is no second storage adapter or immediate need to introduce another state layer. The clock/storage/template responsibilities in stagePlanner are worth watching; a wholesale split was not needed for this request. Existing dead legacy calculator/timeline removal remains complete.

## Validation and review scope

All 238 tests pass. The updated filter test verifies checked/unchecked state, hiding five non-mushroom-only steps, and restoring all sixteen steps. Existing tests exercise editor save/remove, import batch review, resume/cancel, calendar/calculator handoff, Undo, clocks/DST and numeric validation through their existing interfaces. No JSX-mirroring tests were added for the presentation-only extractions.

TypeScript, ESLint, production build and git diff --check pass. Browser checks included checkbox filtering, both shared dialog bodies, real two-image OCR review, a 320 px manual dialog, 390 px dense schedules, desktop calculator modes, and restoring the original plan after temporary review scenarios. These checks do not substitute for physical phone keyboard or screen-reader tests.

The pre-pass source snapshot is `/private/tmp/pikmin-review-reuse.0OL43V/src`. It isolates these changes from the substantial pre-existing uncommitted checkout. No commit, deployment, external publication or default/example data was introduced.


## Accepted-fix implementation follow-up

The subsequent implementation is tracked in [planner-review-fixes.md](planner-review-fixes.md). PlannedTryFields now shares end time, mushroom type, start date, Extra try, and date ordering between the daily form and editor. It uses the existing picker components with MUI minimum/maximum date constraints. Running entry retains its distinct countdown semantics. FilePickerButton supplies native keyboard activation and delegates file format/reset handling to the existing input. Both upload flows retain failed/unread files through useScreenshotReader. PlannerChangeFeedback supplies a dismissible inline status with Undo and contextual View month, replacing the persistent overlay. The non-mushroom visibility filter was removed at the user's request. These supersede the earlier deferred reuse notes above; calculator mode controls and planner navigation retain their distinct roles.
