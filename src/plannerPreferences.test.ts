import { initialPlannerFinishes } from "./testFixtures/screenshotMushrooms";
import {
  emptyPlanner,
  loadPlanner,
  parsePlannerState,
  PLANNER_STORAGE_KEY,
  projectStages,
} from "./stagePlanner";
import { hypotheticalCount, projectionMonth } from "./hypotheticalTries";
beforeEach(() => localStorage.clear());
it("starts empty and falls back to empty for missing or damaged storage", () => {
  expect(loadPlanner("UTC").finishes).toEqual([]);
  localStorage.setItem(PLANNER_STORAGE_KEY, "bad JSON");
  expect(loadPlanner("UTC").finishes).toEqual([]);
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ finishes: [null] }),
  );
  expect(loadPlanner("UTC").finishes).toEqual([]);
});
it("removes only untouched old sample seeds, preserving edited and imported battles", () => {
  const records = initialPlannerFinishes();
  records[1] = { ...records[1], title: "Edited user battle" };
  records[2] = { ...records[2], capturedAt: "2026-10-30T18:00:00Z" };
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ finishes: records }),
  );
  expect(loadPlanner("UTC").finishes.map((record) => record.id)).toEqual([
    records[1].id,
    records[2].id,
  ]);
});
it("uses earliest finish month, advances past expired months and uses next month for an empty plan", () => {
  const now = Date.parse("2026-10-30T12:00Z"),
    records = initialPlannerFinishes();
  expect(projectionMonth(now, "UTC", [])).toBe("2026-11");
  expect(projectionMonth(now, "UTC", records)).toBe("2026-11");
  expect(
    projectionMonth(now, "UTC", [
      { ...records[0], endAt: "2026-10-31T12:00Z" },
    ]),
  ).toBe("2026-10");
  expect(projectionMonth(Date.parse("2026-12-01T12:00Z"), "UTC", records)).toBe(
    "2026-12",
  );
});
it("excludes missed finishes from allocation but keeps their spent free start", () => {
  const records = initialPlannerFinishes()
    .slice(0, 3)
    .map((record, index) => ({
      ...record,
      source: "hypothetical" as const,
      tryDay: "2026-10-31",
      missed: index === 0,
    }));
  const allocated = projectStages(records, Date.now()).rows.flatMap(
    (row) => row.finishes,
  );
  expect(allocated.map((record) => record.id)).toEqual([
    records[1].id,
    records[2].id,
  ]);
  expect(hypotheticalCount("2026-10-31", records, "UTC")).toBe(3);
  expect(
    hypotheticalCount(
      "2026-10-31",
      records.map((record, index) => ({ ...record, usesFreeTry: index !== 1 })),
      "UTC",
    ),
  ).toBe(2);
});
it("round-trips preferences and records through a validated backup", () => {
  const state = {
    ...emptyPlanner("America/Los_Angeles"),
    finishes: initialPlannerFinishes(),
    sleepStart: "23:00",
    sleepEnd: "07:00",
    minimumGapMinutes: 30,
    selectedMonth: "2026-11",
  };
  expect(parsePlannerState(JSON.parse(JSON.stringify(state)), "UTC")).toEqual(
    state,
  );
  expect(parsePlannerState({ ...state, finishes: [null] }, "UTC")).toBeNull();
});
it.each([
  { startAt: "invalid" },
  { tryDay: "2026-02-30" },
  { plannedAp: "invalid" },
  { status: "unknown" },
])("rejects malformed optional battle data: %j", (invalid) => {
  expect(
    parsePlannerState(
      { finishes: [{ ...initialPlannerFinishes()[0], ...invalid }] },
      "UTC",
    ),
  ).toBeNull();
});
