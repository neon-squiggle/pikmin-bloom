import { mergePlannerChanges } from "./plannerPersistence";
import { emptyPlanner, PlannerFinish } from "./stagePlanner";

const battle = (id: string): PlannerFinish => ({
  id,
  title: id,
  type: "Small Red Mushroom",
  source: "manual",
  endAt: "2026-11-02T12:00:00Z",
});
it("merges independent additions, changes and settings without reviving removed mushrooms", () => {
  const original = {
    ...emptyPlanner("UTC"),
    finishes: [battle("A"), battle("B")],
  };
  const remote = {
    ...original,
    finishes: [battle("B"), battle("C")],
    sleepStart: "23:00",
  };
  const local = {
    ...original,
    finishes: [
      battle("A"),
      { ...battle("B"), endAt: "2026-11-05T12:00:00Z" },
      battle("D"),
    ],
    minimumGapMinutes: 30,
  };
  const merged = mergePlannerChanges(original, local, remote);
  expect(merged.finishes.map((item) => item.id)).toEqual(["B", "C", "D"]);
  expect(merged.finishes[0].endAt).toBe("2026-11-05T12:00:00Z");
  expect(merged).toMatchObject({ sleepStart: "23:00", minimumGapMinutes: 30 });
  const undone = mergePlannerChanges(local, original, merged);
  expect(undone.finishes.map((item) => item.id)).toEqual(["B", "C"]);
  expect(undone.finishes[0]).toEqual(battle("B"));
});
it("deduplicates independently added observations of one running mushroom", () => {
  const original = emptyPlanner("UTC");
  const remote = { ...original, finishes: [battle("A")] };
  const local = {
    ...original,
    finishes: [{ ...battle("B"), title: "A", endAt: "2026-11-04T12:00:00Z" }],
  };
  expect(mergePlannerChanges(original, local, remote).finishes).toEqual([
    { ...local.finishes[0], id: "A" },
  ]);
});
it("merges separate months' progress settings and applies intentional resets", () => {
  const original = emptyPlanner("UTC");
  const progress = {
    stage: 3,
    step: 3,
    counted: 2,
    asOf: "2026-11-02T12:00:00Z",
  };
  const remote = { ...original, eventProgress: { "2026-11": progress } };
  const local = { ...original, eventProgress: { "2026-12": progress } };
  expect(mergePlannerChanges(original, local, remote).eventProgress).toEqual({
    ...remote.eventProgress,
    ...local.eventProgress,
  });
  expect(mergePlannerChanges(remote, original, remote).eventProgress).toEqual(
    {},
  );
});
