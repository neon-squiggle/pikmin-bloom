import { mergeImportedFinishes } from "./plannerRecords";
import { PlannerState } from "./stagePlanner";

const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

// Apply this tab's edits, rather than replacing another tab's whole snapshot.
export const mergePlannerChanges = (
  before: PlannerState,
  after: PlannerState,
  remote: PlannerState,
): PlannerState => {
  const removed = new Set(
    before.finishes
      .filter((record) => !after.finishes.some((next) => next.id === record.id))
      .map((record) => record.id),
  );
  const changed = after.finishes.filter(
    (record) =>
      !equal(
        record,
        before.finishes.find((previous) => previous.id === record.id),
      ),
  );
  const result = {
    ...remote,
    finishes: mergeImportedFinishes(
      remote.finishes.filter((record) => !removed.has(record.id)),
      changed,
    ),
  };
  for (const key of [
    "timezone",
    "hideOtherSteps",
    "selectedMonth",
    "sleepStart",
    "sleepEnd",
    "minimumGapMinutes",
  ] as const) {
    if (!equal(before[key], after[key]))
      Object.assign(result, { [key]: after[key] });
  }
  result.eventProgress = { ...remote.eventProgress };
  for (const month of Array.from(
    new Set([
      ...Object.keys(before.eventProgress),
      ...Object.keys(after.eventProgress),
    ]),
  )) {
    if (!equal(before.eventProgress[month], after.eventProgress[month])) {
      if (after.eventProgress[month])
        result.eventProgress[month] = after.eventProgress[month];
      else delete result.eventProgress[month];
    }
  }
  return result;
};

// Stable order prevents tabs from repeatedly rewriting equivalent record lists.
export const serializePlanner = (state: PlannerState) => JSON.stringify(state);
export const plannerSignature = (state: PlannerState) =>
  JSON.stringify({
    ...state,
    finishes: [...state.finishes].sort((a, b) => a.id.localeCompare(b.id)),
    eventProgress: Object.fromEntries(
      Object.entries(state.eventProgress).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    ),
  });
