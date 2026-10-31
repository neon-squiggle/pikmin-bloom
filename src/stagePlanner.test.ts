import { initialPlannerFinishes } from "./testFixtures/screenshotMushrooms";
import {
  finishTimeCandidates,
  loadPlanner,
  localDateTime,
  parsePlannerState,
  PlannerFinish,
  PLANNER_STORAGE_KEY,
  projectStages,
  selectedFinishTime,
} from "./stagePlanner";

const finish = (id: string, endAt: string): PlannerFinish => ({
  id,
  endAt,
  title: id,
  type: "Small Red Mushroom",
  source: "hypothetical",
});

it("starts at a partially credited step and keeps earlier ends out of the new allocation", () => {
  const progress = {
    stage: 3,
    step: 3,
    counted: 2,
    asOf: "2026-11-02T12:00:00Z",
  };
  const records = [
    finish("old", progress.asOf),
    ...[3, 4, 5].map((day) => finish(String(day), `2026-11-0${day}T12:00:00Z`)),
  ];
  const rows = projectStages(
    records,
    Date.parse("2026-11-04T13:00:00Z"),
    progress,
  ).rows;
  expect(rows[0]).toMatchObject({
    id: "3-3",
    creditedCount: 2,
    pastCount: 4,
    presumedComplete: true,
  });
  expect(rows[0].finishes.map((record) => record.id)).toEqual(["3", "4"]);
  expect(rows[1].finishes.map((record) => record.id)).toEqual(["5"]);
  expect(records).toHaveLength(4);
});
it("starts from non-mushroom steps and extends repeating stages only as needed", () => {
  const progress = {
    stage: 5,
    step: 2,
    counted: 0,
    asOf: "2026-11-01T12:00:00Z",
  };
  const rows = projectStages(
    [2, 3, 4].map((day) => finish(String(day), `2026-11-0${day}T12:00:00Z`)),
    0,
    progress,
  ).rows;
  expect(rows[0].id).toBe("5-2");
  expect(rows[0].tasks).toEqual(["Grow 2 Pikmin"]);
  expect(rows.find((row) => row.id === "5-4")?.finishes).toHaveLength(2);
  expect(rows.find((row) => row.id === "6-2")?.finishes).toHaveLength(1);
  expect(rows.some((row) => row.stage > 6)).toBe(false);
});
it("accepts an already filled quota and places subsequent ends in the next mushroom task", () => {
  const progress = {
    stage: 5,
    step: 4,
    counted: 2,
    asOf: "2026-11-01T12:00:00Z",
  };
  const rows = projectStages(
    [finish("next", "2026-11-02T12:00:00Z")],
    0,
    progress,
  ).rows;
  expect(rows[0]).toMatchObject({
    id: "5-4",
    creditedCount: 2,
    presumedComplete: true,
  });
  expect(
    rows.find((row) => row.id === "6-2")?.finishes.map((record) => record.id),
  ).toEqual(["next"]);
});
it("validates month-scoped progress without discarding valid mushrooms for invalid settings", () => {
  const good = { stage: 3, step: 3, counted: 2, asOf: "2026-11-02T12:00:00Z" };
  const saved = {
    finishes: [finish("valid", "2026-11-03T12:00:00Z")],
    eventProgress: { "2026-11": good, "2026-12": { ...good, counted: 99 } },
  };
  expect(parsePlannerState(saved, "UTC")?.eventProgress).toEqual({
    "2026-11": good,
  });
  expect(parsePlannerState(saved, "UTC")?.finishes).toHaveLength(1);
});

it("projects the five samples into successive mushroom steps while retaining all sixteen tasks", () => {
  const { rows } = projectStages(
    initialPlannerFinishes(),
    Date.parse("2026-10-30T00:00Z"),
  );
  expect(rows).toHaveLength(16);
  expect(
    rows.find((row) => row.id === "1-4")?.finishes.map((record) => record.id),
  ).toEqual(["IMG_4082", "IMG_4083"]);
  expect(
    rows.find((row) => row.id === "2-2")?.finishes.map((record) => record.id),
  ).toEqual(["IMG_4085", "IMG_4084"]);
  expect(
    rows.find((row) => row.id === "2-3")?.finishes.map((record) => record.id),
  ).toEqual(["IMG_4086"]);
  expect(rows.every((row) => !row.presumedComplete)).toBe(true);
  expect(rows.find((row) => row.id === "3-4")?.tasks).toContain(
    "Plant 2,000 most common primary",
  );
});

it("infers completed steps from past finishes, not projected coverage", () => {
  const { rows } = projectStages(
    initialPlannerFinishes(),
    Date.parse("2026-11-04T10:40Z"),
  );
  expect(
    rows.filter((row) => row.presumedComplete).map((row) => row.id),
  ).toEqual(["1-1", "1-2", "1-3", "1-4", "2-1"]);
  expect(rows.find((row) => row.id === "2-2")?.pastCount).toBe(1);
  expect(rows.find((row) => row.id === "2-2")?.finishes).toHaveLength(2);
});

it("reorders stages and restores hidden steps after a past finish is edited into the future", () => {
  const records = initialPlannerFinishes().slice(0, 2);
  const now = Date.parse("2026-11-03T00:00Z");
  expect(
    projectStages(records, now).rows.find((row) => row.id === "1-4")
      ?.presumedComplete,
  ).toBe(true);
  records[0] = { ...records[0], endAt: "2026-11-10T00:00:00Z" };
  const row = projectStages(records, now).rows.find(
    (step) => step.id === "1-4",
  );
  expect(row?.presumedComplete).toBe(false);
  expect(row?.finishes.map((record) => record.id)).toEqual([
    "IMG_4083",
    "IMG_4082",
  ]);
});

it("redistributes all five simultaneous tries across successive tasks", () => {
  const records = [1, 2, 3, 4, 5].map((id) =>
    finish(String(id), "2026-11-01T12:00:00Z"),
  );
  const { rows } = projectStages(records, 0);
  expect(rows.find((row) => row.id === "1-4")?.finishes).toHaveLength(2);
  expect(rows.find((row) => row.id === "2-2")?.finishes).toHaveLength(2);
  expect(rows.find((row) => row.id === "2-3")?.finishes).toHaveLength(1);
  expect(rows.flatMap((row) => row.finishes)).toHaveLength(5);
});

it("continues into another stage set when all 39 mushroom slots are filled", () => {
  const records = Array.from({ length: 41 }, (_, index) =>
    finish(
      String(index),
      new Date(Date.UTC(2026, 10, 1, 0, index)).toISOString(),
    ),
  );
  const plan = projectStages(records, 0);
  expect(plan.rows.flatMap((row) => row.finishes)).toHaveLength(41);
  expect(plan.rows.map((row) => row.stage)).not.toContain(6);
  expect(plan.rows.find((row) => row.id === "5-1")?.tasks).toEqual([
    "Walk 1,000 steps",
  ]);
  expect(
    plan.rows
      .find((row) => row.id === "5-4")
      ?.finishes.map((record) => record.id),
  ).toEqual(["39", "40"]);
});

describe("timezone editing", () => {
  it.each([
    [
      "America/Los_Angeles",
      "2026-11-01T01:30",
      ["2026-11-01T08:30:00.000Z", "2026-11-01T09:30:00.000Z"],
    ],
    [
      "Australia/Lord_Howe",
      "2026-04-05T01:45",
      ["2026-04-04T14:45:00.000Z", "2026-04-04T15:15:00.000Z"],
    ],
    ["Asia/Kolkata", "2026-11-01T12:00", ["2026-11-01T06:30:00.000Z"]],
    [
      "Europe/Berlin",
      "2026-10-25T02:30",
      ["2026-10-25T00:30:00.000Z", "2026-10-25T01:30:00.000Z"],
    ],
  ])("resolves the wall clock in %s", (zone, wallTime, expected) => {
    expect(
      finishTimeCandidates(wallTime, zone).map((instant) =>
        new Date(instant).toISOString(),
      ),
    ).toEqual(expected);
  });

  it.each([
    ["America/Los_Angeles", "2026-03-08T02:30"],
    ["Europe/Berlin", "2026-03-29T02:30"],
    ["Australia/Lord_Howe", "2026-10-04T02:15"],
    ["Asia/Tokyo", "2026-02-30T12:00"],
  ])(
    "rejects nonexistent dates and daylight-saving gaps in %s",
    (zone, value) => {
      expect(finishTimeCandidates(value, zone)).toEqual([]);
    },
  );

  it("requires an explicit occurrence for a repeated clock and round-trips seconds", () => {
    const wall = "2026-11-01T01:30:26";
    const candidates = finishTimeCandidates(wall, "America/Los_Angeles");
    expect(selectedFinishTime(wall, "America/Los_Angeles", "")).toBeNull();
    expect(
      selectedFinishTime(wall, "America/Los_Angeles", String(candidates[1])),
    ).toBe(candidates[1]);
    expect(localDateTime(candidates[1], "America/Los_Angeles")).toBe(wall);
    expect(localDateTime(candidates[1], "Asia/Tokyo")).toBe(
      "2026-11-01T18:30:26",
    );
  });

  it("accepts whole seconds serialized with zero milliseconds by native fields", () => {
    expect(
      finishTimeCandidates("2026-10-30T10:56:19.000", "America/Los_Angeles"),
    ).toEqual([Date.parse("2026-10-30T17:56:19Z")]);
  });
});

it("restores edits and filters, and safely falls back when browser data is damaged", () => {
  localStorage.clear();
  const state = loadPlanner("Asia/Tokyo");
  state.finishes = initialPlannerFinishes();
  state.finishes[0].title = "Edited title";
  state.hideOtherSteps = true;
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
  expect(loadPlanner("Europe/Berlin")).toEqual(state);
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ finishes: [null] }),
  );
  expect(loadPlanner("Europe/Berlin").finishes).toHaveLength(0);
  localStorage.clear();
});
