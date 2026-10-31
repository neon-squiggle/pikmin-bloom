# Implementation Plan: Live Inverse Mushroom Calculator

## Completed

- [DONE] Restore the four-value live inverse solver.
- [DONE] Use the same AP, start, finish, and health fields as inputs/outputs.
- [DONE] Select AP as the default calculated value.
- [DONE] Recalculate the selected field whenever another value changes.
- [DONE] Keep calculated fields read-only and visually highlighted.
- [DONE] Remove finish-goal comparison and known-join trial-and-error UI.
- [DONE] Restore automatic planned later-join calculation after a valid baseline.
- [DONE] Preserve the in-progress snapshot and mismatch warning.
- [DONE] Preserve bidirectional join-time/additional-AP calculations.
- [DONE] Support division among 1, 2, 3, and 4 joining players.
- [DONE] Update focused component tests.
- [DONE] Run TypeScript, ESLint, full tests, production build, and diff checks.
- [DONE] Verify AP-from-target and finish-from-AP interactions in the browser.
- [DONE] Verify desktop/mobile sizing and browser console output.

## Verification result

- TypeScript passed.
- ESLint passed.
- 99 tests passed.
- Production build passed.
- Browser verification calculated 80,000 AP for a one-hour Giant Event, then
  recalculated the same finish field to 2:00 PM after switching the output to
  Estimated finish and changing AP to 40,000.
