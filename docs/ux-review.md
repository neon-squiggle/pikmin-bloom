> Historical review: the user’s subsequent decisions and completed implementation are recorded in [planner-usability-implementation.md](planner-usability-implementation.md). Rejected suggestions here are not current requirements. In particular, there are no general sleep markers, task-readiness gates, completion confirmations, sample defaults, or generic calculator-to-planner save action.

# Independent UX review

Reviewed October 30, 2026. Recommendations only; this review does not authorize or implement interface changes.

The app has a useful foundation: a small number of destinations, familiar form controls, editable imports, local finish timestamps, and reversible removals. Its largest gaps concern the reliability and usefulness of the plan: whether a finish can count, whether there is enough time to advance before the next finish, which month is being viewed, and whether a daily start is free. A visual redesign alone would not resolve these gaps.

## First actions

1. Show the running battle's local estimated finish directly, with a trustworthy observation time.
2. Name the stage result “Projected allocation”; start with one compact assumption label, “Assumes other tasks are ready,” and a way to correct missed/uncounted finishes. No wall of warnings is needed.
3. Make the next finishes and gaps scannable, and keep out-of-month battles findable through an explicit month/all-battles control.
4. Label daily counts as planned starts, distinguish free/extra/unknown usage, and refresh at midnight.
5. Protect unsaved work from app updates and make replacement/copy outcomes accurate and recoverable.

## Scope and evidence

This review starts from the current application and the user's stated purpose, independently of earlier design preferences. The intended users understand Pikmin Bloom. Recommendations favor short labels, visible outcomes, and controls for app behavior; they do not call for game tutorials or explanatory paragraphs throughout the interface.

The user's domain constraints are treated as product requirements: three free starts reset daily; joining spends a start; a destruction counts only when the relevant monthly mushroom task is active. Carryovers and new-month starts must be projected together. Sleeping through two finishes can waste one if advancing between tasks requires action. The review does not independently verify live game rules or monthly task content.

Source coverage includes the mounted Calculator and Calendar, both calculator modes, join planning, screenshot reading/review, editing, daily hypotheses, persistence, update handling, mobile layout and accessibility semantics. `Timeline`, `EventList`, `MoreInfo`, and `MushStages` remain in the repository but are not mounted by the current [View](/Users/adechen/Projects/pikmin-bloom/src/View.tsx:149); their controls are not counted as available features. The legacy provider is still mounted by [index.tsx](/Users/adechen/Projects/pikmin-bloom/src/index.tsx:16), which does not make those old views reachable.

Evidence labels below distinguish **source-confirmed behavior** from **usability hypotheses** that require testing. Source review cannot establish real-device keyboard behavior, screen-reader output, measured contrast, OCR success rates, or player comprehension. Browser observations are recorded separately when available. This is a heuristic review, not a WCAG conformance certification or a user study.

Browser inspection used the local app in an isolated temporary tab at desktop 1280×720, mobile 390×844, and narrow 320 px width. Test imports and forms were canceled without changing saved user records. This is browser emulation, not a physical-keyboard, mobile operating-system or screen-reader test.

| Browser observation | Evidence |
| --- | --- |
| Desktop Small Red selection autofilled health/AP and displayed a green derived finish. | [Desktop calculator](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-calculator-desktop.jpg) |
| Real `IMG_4082` import at 390 px populated capture time (10:56:19), health, AP and countdown. No baseline finish was rendered before the Desired end time section. | [Import result](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-in-progress-mobile.jpg), [countdown and optional planning](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-countdown-calculator-mobile.jpg) |
| Calendar displayed the stage list and fixed bottom navigation at 390 px. At 320 px document/client widths were both 320. | [Mobile Calendar](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-calendar-mobile.jpg) |
| Manual full-screen editor fit its two-column countdown and bottom actions at 320 px. | [Manual editor](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-manual-320.jpg) |
| Two-file screenshot reading completed at 320 px; review marked matches as updates and wrapped footer actions into two rows without losing Save/Cancel. Records were not committed. | [Batch review](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-import-review-320.jpg) |
| Start-day picker fit at 320 px with OK/Cancel visible. | [Date picker](/Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/reuse-date-picker-320.jpg) |

The review uses NN/g's principles of visible status, real-world mapping, consistency, user control, error prevention, recognition, and recovery as evaluation criteria. They are general heuristics, not evidence that a particular layout will succeed with these players. [NN/g: 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). Accessibility recommendations use the W3C criteria cited beside each finding; Apple and Material guidance supply interaction conventions rather than mandatory styling for this web app.

## Priority recommendations

P1 means a plan can be materially misleading, a core planning question cannot be answered directly, or work can be lost. P2 means avoidable friction or functional ambiguity. P3 is polish. These are review judgments, not measured incident frequencies.

### 1. P1 — Distinguish projected allocation from actual event credit

**Source-confirmed:** [projectStages](/Users/adechen/Projects/pikmin-bloom/src/stagePlanner.ts:66) sorts every finish and fills mushroom quotas sequentially. It has no active-step, partial-quota, prerequisite-ready-time, or missed-finish input. Past timestamps alone produce `presumedComplete`. The calendar says mushrooms “fill the next event slot” and displays “Presumed done” ([MushroomPlanner](/Users/adechen/Projects/pikmin-bloom/src/MushroomPlanner.tsx:135)).

**Consequence:** An elapsed finish can be assigned to a task that was not active, including a hypothetical battle that never started. Two overnight destructions can appear to advance across intervening tasks while the player is asleep. Displaying the walking/planting requirements does not make the allocator account for them.

**Recommend:** Keep the allocator as a clearly named scenario, such as “Projected allocation.” Replace elapsed-time completion wording with a timing fact such as “Finish time passed.” Begin with one compact assumption label and a way to correct a missed/not-counted finish. Add actual progress or earliest-ready-time controls only where needed to make the scenario actionable; this does not require a task-management interface. A projection must remain conditional until the player confirms reality. Do not infer task completion or claim automatic event credit. Put details on demand, not in repeated warnings.

**Acceptance scenario:** With one mushroom left in the active task and finishes at 02:00 and 03:00, the second must not appear as established credit for the following task without a readiness assumption or user correction. This is product-specific reasoning from the supplied rules; the general evaluation basis is accurate status and real-world mapping, as defined in the NN/g source above.

Also identify the task template's month/version. [stageSteps](/Users/adechen/Projects/pikmin-bloom/src/stagePlanner.ts:31) is a static template with generic “primary”/“secondary” flower names, and later rounds reuse its four-stage pattern. The month header changes independently. This review has not verified those quotas against a live event; label an unverified template as such instead of making the date header imply current event accuracy.

### 2. P1 — Make the chronological finish schedule actionable

**Source-confirmed:** The only mounted finish overview is divided into stage/step sections. Each [FinishRow](/Users/adechen/Projects/pikmin-bloom/src/MushroomPlanner.tsx:30) shows a local date/time, title, type and edit action, but no interval to the next finish, sleep window, collision marker, or deadline for prerequisite tasks. All steps render before daily planning ([MushroomPlanner](/Users/adechen/Projects/pikmin-bloom/src/MushroomPlanner.tsx:142)).

**Recommend:** Add a compact chronological agenda or an equivalent chronological lens within the planner. Make the next finish, same-night clusters, time between finishes, month boundary, and intervening tasks easy to scan. Allow an optional sleep/unavailable interval and a user-chosen minimum preparation gap. Flag “23 min before next finish” or “During sleep window” as timing risks, not proof that credit will be lost. Preserve the stage view as another way to inspect the same plan; a month grid is not inherently better for this job.

**Hypothesis to test:** A chronological agenda with explicit gaps lets players identify a risky cluster faster than stage sections alone. Test a realistic batch of 30+ carryovers, not only the five seeds. The recommendation is an application of the user's planning requirements, not a platform rule requiring a particular visualization.

### 3. P1 — Expose target month and recover finishes outside it

**Source-confirmed:** [projectionMonth](/Users/adechen/Projects/pikmin-bloom/src/hypotheticalTries.ts:5) changes its target to next month after the 15th. [MushroomPlanner](/Users/adechen/Projects/pikmin-bloom/src/MushroomPlanner.tsx:81) filters finishes to that month before rendering, with no month selector or all-battles list. An otherwise valid finish saved for the current or later month can therefore disappear from the only editable overview. The subheader names the target, but body copy says “this month.”

**Recommend:** Make the target month an explicit compact control, defaulting intelligently for carryover planning. Keep an “All battles” or “Outside November (2)” recovery path. Report where an out-of-month save went; do not rely on a generic success toast. Use the actual month name instead of relative copy where the two differ. Store all finish instants through rollover.

**Acceptance scenario:** On October 30, saving an October 31 finish remains findable and editable while November is selected. On November 16, the user can still inspect November. This follows visible scope and user control; no extra game explanation is needed.

### 4. P1 — Keep example data separate from the player's plan

**Source-confirmed:** [loadPlanner](/Users/adechen/Projects/pikmin-bloom/src/stagePlanner.ts:148) starts with five screenshot records and uses the same fallback for missing or invalid storage. Those records immediately affect allocation. The sample disclosure sits after the whole stage list, daily planner and timezone controls ([MushroomPlanner](/Users/adechen/Projects/pikmin-bloom/src/MushroomPlanner.tsx:179)).

**Recommend:** Use a deliberate “View example” mode or an immediately visible sample-state indicator with “Start my plan.” Avoid mixing examples into actual totals. If saved data cannot be read, distinguish recovery from first use and preserve a way to recover the saved payload rather than silently replacing it with examples. A terse first-use state is sufficient; an onboarding tutorial is unnecessary.

### 5. P1 — Show the existing finish and make snapshot time trustworthy

**Source-confirmed:** [ExistingMushroomCalc](/Users/adechen/Projects/pikmin-bloom/src/ExistingMushroomCalc.tsx:124) calculates `reportedEndTime` but passes it only as join-planning input; the UI never prints the baseline finish. Manual entry anchors snapshot time to the component's first mount ([lines 67–68](/Users/adechen/Projects/pikmin-bloom/src/ExistingMushroomCalc.tsx:67)), and its editable capture-time field appears only after screenshot import. `planningTime` is not a live clock. Conversely, manual Calendar entry calculates countdown expiry from the final Add click ([PlannerFinishEditor](/Users/adechen/Projects/pikmin-bloom/src/PlannerFinishEditor.tsx:30)).

**Consequence:** The primary question “When does this running battle finish locally?” has no direct result in this calculator. Leaving the form open or spending time transcribing/reviewing a countdown can shift its interpretation. An old bullhorn plan can still imply a current action time.

**Recommend:** Show a prominent compact “Estimated finish · Nov 1, 08:15 PST” as soon as enough information exists, independently of optional additional-player planning. Anchor manual observations to a visible “Observed at” time with an explicit refresh/Now action; retain screenshot metadata and allow correction. Calculate from that anchor, then show the resulting instant before saving. Keep elapsed calculations current or label their fixed reference time. Retain the existing snapshot-consistency warning when a mismatch actually exists.

**Acceptance scenario:** A countdown transcribed over three minutes still refers to the moment it was observed, and returning to the form after an hour cannot silently present an hour-old “now.” Timestamp meaning is app functionality and merits a compact label; repeated paragraphs about countdowns do not.

### 6. P1 — Separate free-start accounting from projected finishes

**Source-confirmed:** [tryStartDay/hypotheticalCount](/Users/adechen/Projects/pikmin-bloom/src/hypotheticalTries.ts:11) count only planned entries with a known start. Running screenshot/manual battles supply no start-day usage. Chips nevertheless describe blue as “tries available,” use success styling for every count at least three, and allow a fourth or later try ([DailyTries](/Users/adechen/Projects/pikmin-bloom/src/DailyTries.tsx:40)). Dates stop at the latest actual finish; without actual battles there are no chips.

**Recommend:** Label counts as known planned starts, not verified free allowance. Distinguish free starts, extra/paid starts, and unknown usage. A fourth start may be legitimate; display its cost/status instead of treating `4/3` as the same success state as `3/3`. Make start day easy to set when a user is budgeting starts, while retaining finish time as the allocation key. Let users project the desired new-month days even if no carryovers exist or the last real carryover ends early. Show day boundaries in the chosen timezone.

**Acceptance scenario:** Three projected starts today cannot imply there are still three free starts if the player has already joined a real battle. A battle started October 31 and finishing November 3 consumes October 31's budget and appears in November's finish projection. Avoid a hard three-entry limit, since the player may intentionally use additional attempts.

Refresh daily budget dates at the selected timezone's midnight. The current [refresh schedule](/Users/adechen/Projects/pikmin-bloom/src/MushroomPlanner.tsx:96) runs at the next finish or on focus/visibility, so an uninterrupted foreground session with no near-term finish can retain yesterday's date. Verify this overnight case explicitly.

### 7. P1 — Protect drafts from automatic app updates

**Source-confirmed:** [UpdateNotifier](/Users/adechen/Projects/pikmin-bloom/src/UpdateNotifier.tsx:70) reloads the page immediately when a new production bundle is detected, including on focus/visibility changes. Calculator forms, import-review drafts and open editor fields live in React state, while the planner persists only committed records.

**Recommend:** Replace automatic reload during work with a compact “Update available · Reload” action, or persist and restore in-flight drafts before any reload. Preserve existing successful local saves. This particularly matters when switching between the game, Photos and the browser. No live deployment/update interruption was induced in this review; the risk follows directly from the production code path.

## Workflow and interaction recommendations

### 8. P2 — Connect calculation results to the plan

**Source-confirmed:** [MushCalcRadio](/Users/adechen/Projects/pikmin-bloom/src/MushCalcRadio.tsx:136) offers “Use in planner” only during a Calendar-originated start-time handoff. Normal new-battle calculations and in-progress screenshot calculations have no general save action. The calendar import is a separate workflow.

**Recommend:** Offer a small context-appropriate “Save plan” or “Update battle” action alongside a valid result, with identity selection when necessary. Preserve the existing Cancel/return behavior and calculator draft restoration. If save is intentionally unsupported for a scenario, make that boundary apparent through the available actions. Do not send users through a blank manual form to retype an already computed instant.

**Hypothesis to test:** Players expect imported calculator screenshots to update the same battle in Calendar. Validate this expectation before unifying the workflows, and avoid two hidden copies of the battle.

### 9. P2 — Make updates and duplicate matching explicit at the point of commitment

**Source-confirmed:** [plannerRecords](/Users/adechen/Projects/pikmin-bloom/src/plannerRecords.ts:3) identifies battles by normalized title and type. Manual saving can replace a matching record; screenshot merging consolidates matching records and ignores an older capture ([calendarScreenshotImport](/Users/adechen/Projects/pikmin-bloom/src/calendarScreenshotImport.ts:23)). Review says “Update existing,” but does not show the target record or its previous finish. Aggregate counts are shown only after Save. Calendar import has no Undo counterpart to removal.

**Recommend:** Show a compact update comparison: target battle, old finish → new finish, and “Older capture — skipped” before saving. Provide batch Undo for replacements. Keep the normal title/type update rule when it matches the game's one-battle-per-location model. Do not add matching controls merely because a theoretical collision can be imagined. If real data demonstrates ambiguous titles or imported identities, then evaluate a targeted resolution control. Avoid imposing confirmations on every ordinary edit; use review only when the match or overwrite has consequences.

**Acceptance scenario:** An older screenshot does not advertise an update that will be skipped, and an updated finish can be reverted. Same-title/type records representing distinct battles are an unverified data-quality hypothesis, not an established game scenario or a requirement for new matching UI.

### 10. P2 — Validate numeric meaning without silently changing it

**Source-confirmed:** [NumberSpinner](/Users/adechen/Projects/pikmin-bloom/src/NumberSpinner.tsx:35) strips non-digits and, in integer mode, removes decimal points; `1.5` becomes `15`, and `-2` becomes `2`. Values outside a limit are clamped on blur with no explanation. Countdown hours/minutes/seconds use those limits. The actual user frequency of such entry mistakes is unmeasured.

**Recommend:** Preserve the entered text until it can be validated; reject or clearly identify unsupported decimal/sign formats instead of changing the numeric meaning. Explain a range correction next to the relevant field, and associate the message programmatically. A short “Hours: 0–23” or “Enter a whole number” is enough. W3C explicitly includes automatically corrected out-of-range values in its error-identification guidance. [WCAG 3.3.1: Error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html).

### 11. P2 — Explain blocked actions through fields, not disabled buttons alone

**Source-confirmed:** [PlannerFinishEditor](/Users/adechen/Projects/pikmin-bloom/src/PlannerFinishEditor.tsx:32) combines title, type, datetime, and start/finish ordering into an `invalid` flag. Some conditions only disable Save. The daily form provides a text error for finish-before-start, but the main editor does not. Batch Save is disabled if any draft is invalid ([CalendarScreenshotUpload](/Users/adechen/Projects/pikmin-bloom/src/CalendarScreenshotUpload.tsx:118)).

**Recommend:** Identify invalid fields after appropriate interaction and state the correction beside them. For a long batch, show “2 screenshots need review” with a way to jump to the first. Retain correctly entered values. Do not add an always-visible wall of form instructions. Required labels and suitable error messages serve different purposes; both need accessible relationships. [WCAG 3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [WCAG 3.3.2](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), [official Material text-field validation](https://github.com/material-components/material-web/blob/main/docs/components/text-field.md#validation).

### 12. P2 — Make join planning optional and label the model precisely

**Source-confirmed:** Once a new plan is complete, the additional-player section appears automatically. Its heading is a long question. The join instant is labeled “Bullhorn time,” although [the calculation](/Users/adechen/Projects/pikmin-bloom/src/JoinPlanner.tsx:75) models when AP is added. Results appear only when a target is earlier than baseline; other targets can leave no explanation. The slider is labeled as time but its value text reports only AP ([JoinPlanner](/Users/adechen/Projects/pikmin-bloom/src/JoinPlanner.tsx:170)).

**Recommend:** Consider a collapsed “Additional players” section, keeping the baseline finish visible outside it. Use “Players join at” for the modeled instant; if invitations are sent earlier, represent that separately rather than equating invitation and arrival. Add brief contextual feedback only for an impossible target. Keep the exact date/time field as the primary precision input, with the slider as optional exploration. Include both join time and required AP in its accessible value text. An AP entry that adjusts join time should visibly communicate that relationship.

**Hypotheses to test:** Whether “Bullhorn time” is accepted shorthand for effective joining, whether players want that section expanded by default, and whether one-second slider resolution is useful over multi-day windows. These are user-model questions, not proven conventionality failures.

### 13. P2 — Shorten redundant copy and clarify app-specific labels

**Recommend from source review:** Keep short “New battle” and “In progress” choices at all widths. Evaluate “Calculate” as the radio-group label and consistently name the output “Finish time” across calculator/planner. Mark the selected read-only computed field with a textual “Calculated” cue as well as its color. “Calendar” currently opens a stage projection list; test whether “Planner” or “Schedule” predicts it better before renaming.

Candidates for progressive disclosure or removal include the repeated seasonal-name helper under every type picker, repeated timestamp copy buttons for secondary fields, daily chip color legend when the counts/status can explain themselves, and the long screenshot-review preamble repeated for every batch. Prefer “Copy Discord time” over the ambiguous visible “Timestamp” label. Preserve concise metadata exceptions, update behavior, and local-save status because those describe the app rather than game rules.

Evidence: [MushroomTypeField](/Users/adechen/Projects/pikmin-bloom/src/MushroomTypeField.tsx:28), [DailyTries](/Users/adechen/Projects/pikmin-bloom/src/DailyTries.tsx:45), [CalendarScreenshotUpload](/Users/adechen/Projects/pikmin-bloom/src/CalendarScreenshotUpload.tsx:106), [DiscordTimestampField](/Users/adechen/Projects/pikmin-bloom/src/DiscordTimestampField.tsx:34). Clear visible labels should identify expected input without excessive instructions. [WCAG 3.3.2](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html). These wording and density changes are hypotheses to validate with experienced players; additional text is not the default solution.

Concrete copy candidates, to test rather than implement wholesale:

| Current | Concise alternative |
| --- | --- |
| Plan a new battle / Plan a battle in progress | New battle / In progress |
| What do you want to calculate? | Calculate |
| With additional players, when should the battle end? | Additional players |
| Timestamp | Copy Discord time |
| Mushrooms finishing this month fill the next event slot, including those started earlier. | Projected allocation · Assumes other tasks are ready |
| Presumed done | Finish times passed |
| Repeated “Choose a type or enter a seasonal name.” | Remove repeated helper; retain free-text capability |
| Long combined sample/local-storage footer | Separate sample mode from a compact “Saved on this device” status |

Keep missing-capture-time, invalid-field and older-import messages only when those conditions occur. Those messages resolve ambiguity about app behavior; players do not need repeated explanations of familiar game mechanics.

### 14. P2 — Report actual copy/save outcomes and retain recovery

**Source-confirmed:** [DiscordTimestampField](/Users/adechen/Projects/pikmin-bloom/src/DiscordTimestampField.tsx:16) switches to “Copied” without awaiting `clipboard.writeText` or handling failure. Local storage errors do produce a status message, but there is no export/restore surface. Undo exists for removal and clearing daily tries, not for edits/import replacements.

**Recommend:** Show successful copy feedback only after success, with a concise retry or selectable-text fallback on failure. Announce the outcome to assistive technology. Add a lightweight plan export/import or equivalent backup/transfer path appropriate to this local-only tool. Keep storage failure visible, and make failed persistence distinguishable from saved state. Prefer Undo for reversible mistakes over repeated confirmation dialogs. Status changes need to be perceivable without moving focus. [WCAG 4.1.3: Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

### 15. P2 — Retain the good import flow, reduce batch friction

**Source-confirmed positives:** Screenshot reading remains on-device; fields stay editable; missing metadata is not guessed from upload time; progress is announced; users can stop reading, skip a screenshot, retry, and add more. The batch indicator names file and position. [BattleScreenshotUpload](/Users/adechen/Projects/pikmin-bloom/src/BattleScreenshotUpload.tsx:30), [ScreenshotReadingStatus](/Users/adechen/Projects/pikmin-bloom/src/ScreenshotReadingStatus.tsx:6), [CalendarScreenshotUpload](/Users/adechen/Projects/pikmin-bloom/src/CalendarScreenshotUpload.tsx:103).

**Recommend:** Preserve these behaviors. For large imports, add a compact per-file summary with only uncertain/invalid records expanded, optionally with a thumbnail for recognition. Show actionable validation next to the unread value and keep stop-reading separate from discarding completed review work. If close/cancel will discard corrected drafts, retain them or offer Undo/resume rather than making the user reread the batch.

**Hypothesis:** Repeated full-size forms and capture-time corrections are the main batch bottleneck; this needs testing with actual phone exports and OCR errors. Do not fabricate a percentage or time estimate for OCR. Use measured file counts and phase labels while duration is unknown. Apple recommends accurate progress and cancellation where feasible. [Apple HIG: Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators).

## Navigation, mobile, accessibility and secondary surfaces

### 16. P2 — Preserve the small navigation model; verify focus and scroll transitions

**Source-confirmed positives:** Calculator and Calendar use labeled top-level destinations, with desktop tabs and mobile bottom navigation. Forms remain mounted across navigation, and mobile scroll positions are stored ([View](/Users/adechen/Projects/pikmin-bloom/src/View.tsx:24)). Add mushrooms is a content action, separate from destinations. These choices fit Apple's distinction between top-level navigation and actions. [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Apple HIG: Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars).

**Verify/recommend:** For Calendar → Calculator → Calendar handoffs, move focus to the receiving context and restore it to a useful record or triggering control. Avoid scrolling the viewport to a new result without an equivalent discoverable focus/status cue. The radio group's visible FormLabel is not explicitly connected to the RadioGroup by `aria-labelledby`; establish that relationship. Verify desktop arrow-key tab behavior, accessible active state, and hidden-panel exclusion. Follow the [WAI tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) for the actual desktop tab interface; the mobile navigation need not pretend to be a tab widget.

### 17. P2 — Validate actual mobile and assistive-technology use before layout changes

**Source-confirmed positives:** Fields stack on small screens, countdowns use a two-column grid, touch controls commonly receive 44–48 px minimum dimensions, safe-area padding is present, mobile editors become full-screen, and keyboard handling attempts to reveal the focused field and hide floating controls ([theme](/Users/adechen/Projects/pikmin-bloom/src/theme.ts:5), [formStyles](/Users/adechen/Projects/pikmin-bloom/src/formStyles.ts:2), [useMobileKeyboard](/Users/adechen/Projects/pikmin-bloom/src/useMobileKeyboard.ts:41)). These are strengths, not reasons to assume all devices pass.

**Verify/recommend:** Test 320 CSS px width and zoom/reflow; iOS Safari and Android Chrome keyboards; portrait/landscape; long titles and seasonal types; date/time picker dialogs; focus visibility above fixed navigation/FAB/snackbars; and desktop's nested card scrolling. Confirm text/non-text contrast, target size and spacing, programmatic labels, live error/status messages, and reduced-motion behavior. The join planner's unconditional smooth scroll should respect motion preferences. Test the date fields with VoiceOver/TalkBack rather than declaring them accessible because they come from MUI. [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [Target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [Apple HIG: Layout](https://developer.apple.com/design/human-interface-guidelines/layout).

No measured contrast failure, actual keyboard occlusion, or screen-reader failure is asserted from source alone. Native/platform dimensions and WCAG CSS-pixel criteria are not interchangeable.

### 18. P3 — Finish the installed-app identity and settings affordances

**Source-confirmed:** The document title says Pikmin Bloom planner, but [manifest.json](/Users/adechen/Projects/pikmin-bloom/public/manifest.json:2) still says “React App” and “Create React App Sample.” The timezone is available in an accordion at the bottom; calculator dates use the browser zone while Calendar can use a separately selected zone.

**Recommend:** Give the installed app its real name and suitable icon. Keep an unobtrusive timezone indicator near important finish results, especially when the calendar zone differs from the calculator's browser zone. Test travel/timezone changes and daylight-saving transitions. Preserve the existing repeated-clock choice, skipped-clock validation, and instant-preserving timezone edits ([PlannerFinishField](/Users/adechen/Projects/pikmin-bloom/src/PlannerFinishField.tsx:21)); they are substantive correctness features. A compact zone label is preferable to repeating explanatory timezone prose in every form.

## Suggested validation sequence

1. **Eligibility and spacing:** Give an experienced player a partially complete mushroom task, two overnight finishes, and an intervening planting requirement. Ask which finishes could count and what needs action before sleep. The app should expose assumptions without implying confirmed completion.
2. **Carryover and daily budget:** Plan October 31's remaining free starts plus November 1–3 starts. Move one finish across midnight/month boundary; verify it changes the finish projection without silently changing its start-day budget.
3. **Find and correct:** Add a finish outside the selected month, update a battle from a screenshot, and import an older capture. Each result should be findable and reversible. Investigate same-title/type ambiguity only if actual imported data demonstrates it.
4. **Observe and calculate:** Enter a live countdown, wait, return from the game, and inspect the local baseline finish before planning additional players. Verify the observation anchor and fixed/live reference are clear.
5. **Recover work:** Simulate copy denial, OCR timeout/cancel, missing capture metadata, malformed saved data, unavailable storage, and an app update while a draft is open. Correct values and completed work should survive recoverable failures.
6. **Operate accessibly:** Repeat the key flows by keyboard and screen reader, then on real phones with the keyboard open and at zoom. Record failures separately from preferences or speculative improvements.

The first implementation slice should address truthful projection, a usable finish agenda, target-month visibility, snapshot timing and start budgets. Copy reductions and layout experiments should follow those semantics, with actual task performance guiding the choice.
