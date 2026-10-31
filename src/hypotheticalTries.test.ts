import {
  hypotheticalCount,
  hypotheticalDays,
  projectionMonth,
  tryStartDay,
} from "./hypotheticalTries";
import { PlannerFinish } from "./stagePlanner";
const now = Date.parse("2026-10-30T12:00:00Z");
const actual: PlannerFinish = {
  id: "actual",
  title: "Park",
  type: "Small Red Mushroom",
  source: "manual",
  endAt: "2026-11-03T12:00:00Z",
};
it("keeps the same event month through the late-month / early-month rollover", () => {
  expect(projectionMonth(now, "UTC")).toBe("2026-11");
  expect(
    projectionMonth(Date.parse("2026-11-03T12:00Z"), "UTC", [actual]),
  ).toBe("2026-11");
});
it("includes zero-use days from today through the last actual finish, without hypothetical extension", () => {
  const later = {
    ...actual,
    id: "later",
    source: "hypothetical" as const,
    tryDay: "2026-11-03",
    endAt: "2026-11-20T12:00:00Z",
  };
  expect(hypotheticalDays([actual, later], "UTC", now)).toEqual([
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
    "2026-11-02",
    "2026-11-03",
  ]);
  expect(hypotheticalCount("2026-11-01", [actual, later], "UTC")).toBe(0);
  expect(hypotheticalDays([later], "UTC", now)).toHaveLength(7);
});
it("counts the start day separately from the destruction day and does not guess screenshot starts", () => {
  const future = {
    ...actual,
    source: "hypothetical" as const,
    tryDay: "2026-10-31",
  };
  expect(hypotheticalCount("2026-10-31", [future], "UTC")).toBe(1);
  expect(hypotheticalCount("2026-11-03", [future], "UTC")).toBe(0);
  expect(tryStartDay(actual, "UTC")).toBeNull();
  expect(
    tryStartDay(
      { ...actual, status: "planned", startAt: "2026-11-01T01:00:00Z" },
      "America/Los_Angeles",
    ),
  ).toBe("2026-10-31");
});
it("does not generate chips beyond the next event month", () => {
  const days = hypotheticalDays(
    [{ ...actual, endAt: "2027-01-01T12:00:00Z" }],
    "UTC",
    now,
    "2026-11",
  );
  expect(days[days.length - 1]).toBe("2026-11-30");
});
it("extends from today when the latest actual mushroom has already ended", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  const old = { ...actual, endAt: "2026-11-02T12:00:00Z" };
  expect(hypotheticalDays([old], "UTC", now, "2026-11")).toEqual([
    "2026-11-10",
  ]);
  expect(hypotheticalDays([old], "UTC", now, "2026-11", 7)).toHaveLength(8);
});


it("counts explicitly dated uploaded starts, including excluded mushrooms, while leaving unknown starts and tickets uncounted", () => {
  const running = { ...actual, source: "screenshot" as const, tryDay: "2026-10-30", missed: true };
  expect(tryStartDay(running, "UTC")).toBe("2026-10-30");
  expect(hypotheticalCount("2026-10-30", [running, { ...running, id: "ticket", usesFreeTry: false }, { ...running, id: "unknown", tryDay: undefined }], "UTC")).toBe(1);
});
