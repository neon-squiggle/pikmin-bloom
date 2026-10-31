# Fix planner reliability and allow current event progress

This living ExecPlan follows the execution-plan skill. Work in /Users/adechen/Projects/pikmin-bloom. Preserve unrelated uncommitted work and the user's saved mushrooms. Do not deploy or commit this task.

## Purpose

Users can safely edit one plan in multiple tabs, enter numbers in their browser's locale, change planned mushroom types without stale calculations, and expand or contract prospective start dates. They can set the event stage, step, and already counted mushrooms in Settings. Setting progress establishes a fixed time: earlier endings remain history; later endings fill the remaining event requirements.

## Progress

- [x] Confirmed all five defects through isolated review reproductions; existing 264 tests pass.
- [x] User confirmed that progress starts now and past endings remain history.
- [x] Implement and test local-state change merging, including deletion, Undo, racing storage events and retry after a failed write.
- [x] Fix locale parsing, calculated-start invalidation, derived output clearing, and date-chip expansion/collapse.
- [x] Add event-scoped progress and Settings entry, retaining history in End times.
- [x] Run full tests, type checking, lint, build and mobile UI checks. Browser progress draft was canceled; no mushrooms or progress settings were changed.

## Surprises & Discoveries

NumberSpinner formats with browser locale but parses English punctuation, so blur can change Additional AP by 1000 times. Planner persistence writes whole independent tab snapshots. The planned editor retains a derived start and health across type edits. Calculated AP/health do not clear when their dependencies disappear. Prospective dates extend from the latest actual end even if it is before today.

Stable equality checks sort record IDs without reordering stored records. This prevents repeated equivalent writes between tabs while preserving existing record order. Failed writes need to retain the last successfully saved base so the next edit also retries earlier unsaved changes. Regression tests cover this case. Progress can include a fully filled quota; subsequent ends then enter the next mushroom task.

## Decision Log

Use change-based three-way merging: apply only changes between a tab's previous and proposed states to the latest saved state. Reconcile storage events using their old/new payloads. Different mushrooms merge; simultaneous changes to the same mushroom may choose either, as explicitly accepted by the user. Deletions must be applied as changes rather than unioning every saved record.

Keep numeric labels and calculator styles authoritative. Use locale decimal/group separators and localized digits for numeric parsing, with a decimal keyboard. Do not invent confidence prompts. Changing type invalidates the old derived start/health/AP; title and ticket edits preserve them.

Event progress belongs to a month, with stage >= 1, step 1–4, credited mushroom count, and fixed as-of timestamp. Prior stage tasks are omitted from the projected stage list; earlier ends remain editable in End times. Each credited count is part of the current quota but is not an invented mushroom record. The normal projection and empty defaults remain unchanged without this optional setting.

## Context and Orientation

src/MushroomPlanner.tsx owns state, allocation, editing and Undo. src/stagePlanner.ts validates saved state and projects end records into repeating four-stage templates. src/PlannerSettings.tsx contains month, timing, timezone and transfer controls. src/plannerRecords.ts identifies running battles by title/type, while independent hypothetical tries retain their IDs. src/PlannerFinishEditor.tsx and src/DailyTries.tsx share PlannedTryFields. src/NumberSpinner.tsx is the calculator-authoritative numeric input. src/mushroomCalculator.ts computes the selected output.

## Plan of Work

Add a pure change-merging module and a persistence hook, replacing MushroomPlanner's mount-only load and whole-state effect. Add regression tests for independent changes, deletions, settings, same-battle updates and storage events. Fix numerical parsing with a shared locale-aware parser/formatter and regression tests using comma-decimal locales. Invalidate planned derived metadata when its type changes. Clear derived AP/health when prerequisites are invalid. Clamp prospective expansion to today and offer Show fewer only after expansion.

Extend the state parser with validated month-scoped progress. Extend projectStages with an optional starting point and as-of cutoff. Render credited quota counts consistently and keep historical ends visible in the end list. Add a reusable progress Settings section with explicit Apply and Reset actions so ordinary field edits do not move the cutoff repeatedly. Applying saves the current time once. Test partial quotas, non-mushroom steps, repeating stages, month isolation, storage/import, and history behavior.

## Concrete Steps

Run commands in /Users/adechen/Projects/pikmin-bloom:

    CI=true npm test -- --watchAll=false --runInBand --silent
    npx tsc --noEmit
    npm run lint
    npm run build
    git diff --check

Keep localhost:3000 available. Use the browser UI to inspect compact Settings and date controls at mobile width. Do not modify actual saved plans merely to demonstrate multi-tab races; use automated isolated storage tests. Any temporary browser record must be removed via Undo and exported data compared before/after.

## Validation and Acceptance

Two instances adding different mushrooms retain both; deleting in one and changing another in the second does not resurrect the deletion. Locale-formatted numbers survive focus/blur unchanged. Changing type removes obsolete calculated metadata, while renaming does not. Clearing required calculation inputs clears results. The first date expansion reveals future dates even if all actual ends are old; Show fewer reverses only the expanded range. At step 3–3 with two counted, the next two post-Apply ends finish that quota; earlier ends remain in End times and never count twice. The first subsequent end advances to 3–4. Reset restores the original month projection.

## Idempotence and Recovery

No external service or migration is required. Existing valid plans without progress keep original behavior. Import continues combining records while preserving receiving-device settings, including event progress. Undo changes records without reverting later settings. Invalid progress data is ignored without discarding valid records. All verification scripts/logs belong in /private/tmp.

## Interfaces and Dependencies

Use existing React, MUI, TypeScript, Dayjs and Intl APIs; no new dependencies. Add pure mergePlannerChanges(base, proposed, remote) and usePlannerState(browserZone). Add EventProgress with stage, step, counted and asOf. projectStages accepts optional progress and returns projected rows plus historical records where needed. The progress form commits one complete validated setting rather than partially saving every keypress.

## Outcomes & Retrospective

All five requested defects are fixed. Settings includes a compact Set progress/Change progress control, a mobile dialog for Stage/Step/credited count, and Reset progress. Show fewer start dates appears only after expansion and leaves the chosen date intact. The entire 35-suite, 291-test suite passes, as do TypeScript, lint, production build and diff checks. Mobile UI was inspected at 390 px and the draft was canceled. The evidence screenshot is /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/event-progress-mobile.png. No deployment or commit was made. Last-arriving edits to the same record remain deliberately approximate, as authorized; independent records merge.

## Artifacts and Notes

Baseline review results: 32 suites, 264 tests passed. Runtime reproductions live in /private/tmp/pikmin-input-review.cjs and /private/tmp/pikmin-editor-review.cjs. They were run against isolated browser storage.

Final evidence: /private/tmp/pikmin-reliability-final-tests.json, /private/tmp/pikmin-reliability-final-types.log, /private/tmp/pikmin-reliability-final-lint.log and /private/tmp/pikmin-reliability-final-build.log. Plan updated at completion to record implemented persistence recovery, full quotas, and successful verification.

Follow-up UI decision: the user retained the planned end-time default and authorized inline Event progress plus an unboxed calculator screenshot button. EventProgressSettings no longer uses a dialog; the existing integration test exercises the inline form, and focus returns to Set/Change progress after closing. The screenshot upload retains reading status, cancellation, retry and errors. Mobile previews were captured without applying the progress draft or changing saved records.

Follow-up verification: 47 affected tests passed across planner, screenshot autofill and in-progress calculator suites. A final planner rerun after the focus-management adjustment also passed. TypeScript, lint, production build and diff checks passed. Mobile evidence: event-progress-inline-mobile.png and calculator-upload-unboxed-mobile.png in the task visualization directory. The original planned end-time default function was not modified.

Further user direction: Event progress now appears directly in expanded Settings, without another expansion or modal. Apply and Reset remain; a broader separation of Plan setup, personal Settings and Plan data is under discussion, so the requested intermediate section reorder and automatic progress saving were not applied. The update note was moved once to the planner heading area, removing duplicate editor/review text. Sleep fields now use a shared recurring-clock TimePicker with existing responsive picker styles and explicit HH:mm storage. Mobile inspection opened and canceled the picker without changing settings. All 41 affected tests, TypeScript, lint, build and diff checks pass. Evidence logs: /private/tmp/pikmin-settings-consistency-final-tests.log and matching types/lint/build logs. Screenshots: planner-global-update-note.png and sleep-picker-consistency-mobile.png in the task visualization directory.

Latest authorized changes: desktop tabs now sit inside the shared card with a divider; tool panels remove their separate surface styling in embedded mode. Component identities remain stable across the phone breakpoint, preserving calculator drafts. Mobile bottom navigation remains in place. Event progress now saves valid edits immediately, retaining only Reset progress; unchanged focus/blur does not rebase the timestamp or clear the count. A newly reported cancellation bug is fixed by tracking whether the calculation originated in Daily tries or the mushroom editor. Cancel returns to that exact context; daily draft text and end time remain intact without a modal or record changes.

Final validation for these follow-ups: 37 suites and 297 tests passed, including immediate progress saving, no-op blur, inline cancellation, editor cancellation and responsive draft preservation. TypeScript, lint, build and diff checks pass. Logs use the /private/tmp/pikmin-shared-card-complete prefix. Browser checks confirmed the shared desktop card, mobile bottom navigation, absence of Apply, and cancellation returning to the inline draft. No record/progress edits were saved in browser QA. Screenshot: /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/shared-tool-card-desktop.png. Broader Settings reorganization remains a proposal, outside these implemented changes.

Reward-claim timing correction (2026-10-30): Completing a task does not unlock the next task until the player claims the reward. The old timing loop checked only the first mushroom in each new task, then replaced the preceding-task anchor with that mushroom. A four-mushroom regression reproduced both sleep and minimum-gap failures: only c was flagged when both c and d were at risk. The loop now keeps the previous task's last end time fixed for every mushroom in the next task. All endings before sufficient awake time has passed receive May be missed, and later endings do not restart the window. Projection and storage are unchanged. Updated warning tooltips and the existing settings explanation describe the claim requirement. This supersedes historical statements that only the first ending at a transition can receive a warning.

Validation: 42 affected tests pass across plannerTiming and MushroomPlanner, including both Stages and End times, multiple risky endings within one task, sleep spanning several tasks, recovery after wake-up, and safe clustering after a claim window. TypeScript, lint, production build and diff checks pass. The production-build log is /private/tmp/pikmin-reward-claim-build.log. No saved user plan was changed for verification.

Independent timing audit (2026-10-30): The user requested another examination without supplying the remaining bug. New regressions independently exposed (1) simultaneous endings across task boundaries going unflagged with a zero minimum, (2) no check before the first mushroom task at the start of a month, and (3) no check after saved progress on a non-mushroom step or fully credited quota. The initial unit repro returned no risky IDs instead of c/d/e for five simultaneous midday ends; the UI repro failed in all three opening/progress cases. A partial-quota control passed, demonstrating that an unlocked mushroom task must remain safe during sleep.

The timing function now requires the event month and optional progress context from its caller. Opening tasks use local month start; non-mushroom progress and fully credited quotas use the saved cutoff; partial quotas retain their unlocked status. An exact zero gap at a task boundary is always risky. All records still allocate chronologically, and warnings do not exclude any mushroom. Tooltips use available time to reach the task so they also describe opening/progress checks accurately. Existing transition tests now use the second day of the month to isolate that behavior from the newly covered opening tasks. Additional tests verify saved cutoff gaps, Los Angeles month start during fall-back, New York spring-forward and Lord Howe's half-hour spring-forward.

Audit validation: all 37 suites and 312 tests pass, together with TypeScript, ESLint, production build and diff checks. Results are in /private/tmp/pikmin-timing-audit-tests.json, its matching .log, and /private/tmp/pikmin-timing-audit-build.log. The regression tests cover the rendered planner without changing a user's saved browser plan. No deployment or commit was requested.

Confirmed timing semantics (2026-10-30): The user supplied the remaining example: step 2-4 ends November 2 at 01:21, step 3-2's first mushroom ends at 10:18, sleep is 00:00–10:00 and the minimum is 30 minutes. The old code compared only 18 awake minutes with that minimum. The user explicitly selected full elapsed gap with a separate sleep check. Sleep now flags a transition only if there is no awake opportunity to claim before the ending; minimum-gap checks continue using elapsed time. The example's 8-hour-57-minute gap therefore passes. An ending before waking still warns, as does a genuinely short elapsed gap. Simultaneous cross-task endings remain risky. This decision supersedes earlier descriptions/tests comparing the minimum with accumulated awake time.

The minimum control now renders its disabled/default value as empty and remains empty after clear/blur/reload, preserving numeric zero internally for existing storage compatibility. The existing Potential misses explanation describes the two independent causes. Exact 2-4/3-2 integration tests cover both planner views, and a boundary matrix tests endings before, at and after waking. Browser inspection confirmed the empty field without changing saved records/preferences; its temporary tab was closed. Screenshot: /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/independent-timing-settings.png. TypeScript, lint, production build and diff checks passed; affected test/build logs use /private/tmp/pikmin-independent-timing.

Notification consistency (2026-10-30): The user requested uniform, dismissible or timed notifications. Added AppNotice as the single outlined-alert presentation with an accessible Dismiss notification control. Routine successes expire after five seconds. Errors, warnings and action-bearing feedback remain until dismissed so Undo/Reload are not lost. Applied it to planner mutation feedback, screenshot imports/read failures and numeric-confidence warnings, clipboard success/fallback, AP-adjustment feedback, import/save failures and app updates. Ongoing read progress and field validation remain attached to their operations/fields. The calculator-to-planner handoff is presented as a contextual section containing its controls, rather than as a notification. Dismissing an app update suppresses that asset fingerprint for the session, while a later release can notify again.

Validation: all 38 suites and 324 tests pass, plus TypeScript, lint, production build and diff checks. Tests cover repeat-event timeouts, unrelated renders, no duplicate close callback after manual dismissal, persistent Undo, clipboard fallback, per-file error dismissal without losing successful drafts/retry, and update dismissal without replacing a draft. Logs: /private/tmp/pikmin-notifications-tests.json, /private/tmp/pikmin-notifications-tests.log and /private/tmp/pikmin-notifications-build.log. Browser QA used an intentionally invalid local JSON file to trigger import feedback without changing the plan, confirmed mobile close-target layout and removal after dismissal, reset the viewport and closed the temporary tab. Screenshot: /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/uniform-notifications-mobile.png. No commit or deployment was requested.

User correction: action feedback must behave like Gmail's temporary Undo snackbar, including planner saves with Undo. The earlier implementation explicitly disabled that timeout and used inline alerts. Reproduced both exceptions with failing AppNotice/action and real mushroom-edit integration tests. Added ActionFeedback using MUI Snackbar/SnackbarContent and one app-wide latest-message provider. All action outcomes now have the same floating five-second snackbar, with close, hover/focus pause and fresh keys for repeated saves. Undo expires with the snackbar. The previous inline-feedback scrolling was removed. AppNotice now only handles contextual warnings/review validation and has no duplicate timer implementation. Upload failures retain their pending Retry controls and successful drafts. Mobile FAB clearance follows the measured snackbar height, including wrapped messages; snackbar action text inherits the content contrast color.

Verification: 39 suites and 328 tests passed; after the final mobile clearance/contrast adjustment, all 54 affected tests, TypeScript, lint, production build and diff checks passed. Logs use /private/tmp/pikmin-snackbar-complete and /private/tmp/pikmin-snackbar-final. Tests cover real repeated edits, five-second dismissal with Undo, restarting timers, keyboard-focus pause, one visible message, no stale message revival and manual dismissal. Browser QA captured the actual Mushroom saved snackbar on desktop and mobile and confirmed disappearance after waiting. Temporary preview edits were restored via the exported plan: /Users/adechen/Downloads/mushroom-plan (10).json and the final (13).json compare equal across all eight records and preferences. The viewport was reset and temporary tab closed. Final mobile proof: /Users/adechen/.codex/visualizations/2026/10/30/01a18e04-ddd0-7be3-ade4-84b4cb8015a5/planner-save-snackbar-mobile.png. Opera access was not approved; it was not retried. Browser QA used the separate local in-app browser. No deployment or commit was requested.
