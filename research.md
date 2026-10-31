# Research: Live Inverse Mushroom Calculator

## Product model

The planned-battle calculator is a live inverse solver over four values:

- mushroom health;
- starting AP;
- battle start;
- estimated finish.

One value is selected as the calculated output. That same field becomes
read-only and updates immediately whenever another value changes. There is no
separate desired-versus-predicted field.

AP is the default calculated value because the most common question is:

```text
Given this mushroom, this start, and this finish, what AP is required?
```

Users can select estimated finish, battle start, or health to invert the same
equation without leaving the form or duplicating values.

## Later joins

After a valid baseline battle exists, a second-stage calculator appears:

```text
baseline battle + desired earlier finish + join time
→ required additional AP
```

Moving join time updates required AP. Editing available additional AP moves the
join time. The total can be divided among 1, 2, 3, or 4 players.

For a battle already in progress, the same second-stage solver starts from the
game snapshot: current AP, remaining health, and time remaining.

## Existing architecture

- `src/mushroomCalculator.ts` already provides `recomputeDerived` for the four
  planned-battle values.
- `src/helpers.ts` provides the no-join and inverse additional-AP equations.
- `src/JoinPlanner.tsx` owns the bidirectional join-time/AP interaction.
- `src/ExistingMushroomCalc.tsx` gathers and validates an in-progress snapshot.

The correct restructure is primarily information hierarchy and defaults, not a
new calculation model.

## Final interaction decisions

- Restore “What should the calculator find?”
- Select AP by default.
- Keep exactly one field for each value.
- Keep all non-selected fields editable.
- Mark the selected calculated field read-only and visually distinct.
- Recompute on every input or radio change.
- Show the later-join inverse solver automatically after a valid baseline.
- Preserve the in-progress snapshot workflow.
- Support 1–4 joining players.
