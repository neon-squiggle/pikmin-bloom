# Mushroom timer feature audit

Inspected October 30, 2026 through the production site's visible help, Options, timer editor, mushroom picker, Compact list, Event tasks, Transfer, Manage titles, Manage labels, and Delete panels: [SoftSpot Pikmin Mushroom Timers](https://softspot.nl/pikmin/mushroomtimers/). Its help explicitly describes preparing battles to finish in the next event month. The site's displayed version was August 30, 2026; its current event panel identified November 2026 and said its overview was forthcoming.

The rankings below are product judgments for the user's workflow, not measured usage data. The user gets three free starts per day and wants unused opportunities late in a month to become useful destructions next month. Starting a battle spends an attempt; its finish determines where it could count. Finishing during an unfinished flower/growth task may miss a mushroom requirement. These are separate concerns that an elapsed countdown alone cannot resolve.

| Priority | Observed feature group | Predicted usefulness for this workflow |
| --- | --- | --- |
| 1 — Essential | Live countdowns and absolute end times; editable running timers | Establish which battles cross the month boundary; refresh after others join and accelerate a battle. |
| 2 — Essential | Event-task display and an adjustable starting position, including partial mushroom quotas | Map stored finishes onto the actual stage position. Useful even though the requested UI should avoid a task-switching dropdown. |
| 3 — Very high | Planned timers, separate from running and finished timers | Try a carryover schedule without confusing a hypothetical battle with a real battle. |
| 4 — Very high | Android Circle to Search text autofill; instant paste and a configurable time offset | Reduce repetitive entry. Our screenshot-reader approach serves the same goal across platforms; capture metadata avoids approximating the copy/paste delay. |
| 5 — High | JSON import/export, file or clipboard transfer, merge/update by timer ID | Backups and device transfers protect a month of planning. Local storage alone is vulnerable to browser-data clearing. |
| 6 — High | Compact list, running/finished/planned totals and jump controls | Make a batch of 34 battles manageable and expose the next destruction quickly. |
| 7 — Medium-high | Search or filter by mushroom title; saved title suggestions | Find an existing battle quickly when a new observation changes its finish. Exact matching still needs duplicate-battle handling. |
| 8 — Medium | Size and color/type presets, including elemental and event types | Useful identification. Seasonal presets need maintenance; free text must remain possible. |
| 9 — Medium | Custom labels and label management, including separate label transfer | Can group carryovers, invitations, locations, or batches. Adds setup overhead for a single-person workflow. |
| 10 — Medium | Timer duplication | Speeds repeated planning, although duplicating an actual battle can create accidental double counting. |
| 11 — Medium | Solo, bullhorn-used, and invited markers | Helps judge which battles may change speed, but does not predict future participants. |
| 12 — Medium-low | CSV export with selectable columns and separators; clipboard copying | Handy for sharing or spreadsheets, less central than an accurate private plan. |
| 13 — Low | Bulk deletion of finished timers or all timers | Convenient cleanup, but automatic deletion could erase useful timing history and corrections. Prefer reversible cleanup. |
| 14 — Low | Dark appearance, input-area visibility, title-picker visibility, daily update checks | Quality-of-life preferences; lower priority than correct finish and stage behavior. |

## Less obvious controls and limitations

Most functions live under the top-right gear. Its panel has icon tabs for Options, Compact list, Transfer, Event tasks, Delete, Manage titles, Manage labels, and Info. The starting-position selector and merge-on-filter option are disabled while event tasks are hidden. The selector lists repeated rounds beyond stages 1–4, with positions down to individual mushroom requirements. A timer's duration editor has a control to activate/synchronize its countdown and a separate planned-timer toggle. Clearing a title exposes a restore action. The title and label registries can be transferred independently of timers. CSV exports may include only visible timers, and JSON transfer may include task-display settings.

I inspected these controls and the site's own descriptions. I did not test clipboard imports, downloads, every persisted setting combination, or a populated multi-round schedule. The Event tasks panel was an external event overview rather than an interactive readiness editor in the inspected state. The preview version is linked from help but was outside this production audit. I did not find a direct image-upload/OCR flow, automatic three-per-day allocation, start-date daily allowance accounting, or an explicit non-mushroom-task readiness timeline in the inspected controls; this is a statement of what was observed, not a claim that no hidden or preview implementation exists.

## Recommendations to consider later — research only

The highest-value additions are a clear event-month boundary, separate records for start-day allowances and destruction times, and an explicit way to represent tasks being blocked until a chosen time. Preserve carried battles when the month changes; reset the stage projection rather than the stored battles. A battle that finishes too early should stay visible as a missed opportunity rather than silently advancing an event step. Show hypothetical daily additions separately and support clearing them with Undo. Backups are more valuable than complicated tagging early on.

Do not infer that three free daily starts imply three same-day finishes. Likewise, a finish timestamp does not establish that flower/growth tasks were cleared. These are the main modeling risks for this use case, ahead of the number of UI features copied from the reference.

The user explicitly requested that this audit cause no feature implementation. Month management, stage-readiness controls, repeated rounds, transfer, tagging, and other reference-derived features are recommendations only. The authorized implementation is limited to the previously discussed keyboard behavior, screenshot entry/import, daily-control placement with reversible clearing, and removal of the per-mushroom count checkbox.
