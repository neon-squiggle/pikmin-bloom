import {
  awakeMinutesBetween,
  finishTimings,
  nextLocalMidnight,
} from "./plannerTiming";
import { emptyPlanner, PlannerFinish, projectStages } from "./stagePlanner";
const record = (id: string, time: string): PlannerFinish => ({
  id,
  title: id,
  type: "Small Red Mushroom",
  endAt: `2026-11-02T${time}:00Z`,
  source: "manual",
});
const context = { month: "2026-11" };
it.each([
  ["01:21", "10:18", false, false],
  ["09:51", "10:18", false, true],
  ["01:21", "09:59", true, false],
  ["01:21", "10:00", true, false],
  ["01:21", "10:01", false, false],
])(
  "checks sleep separately from the elapsed gap from 2-4 at %s to 3-2 at %s",
  (lastEnd, nextEnd, sleepRisk, shortGap) => {
    const progress = {
      stage: 2,
      step: 4,
      counted: 3,
      asOf: "2026-11-02T00:00:00Z",
    };
    const rows = projectStages(
      [record("last", lastEnd), record("next", nextEnd)],
      0,
      progress,
    ).rows;
    expect(rows.find((row) => row.id === "2-4")?.finishes[0].id).toBe("last");
    expect(rows.find((row) => row.id === "3-2")?.finishes[0].id).toBe("next");
    const timing = finishTimings(
      rows,
      {
        ...emptyPlanner("UTC"),
        sleepStart: "00:00",
        sleepEnd: "10:00",
        minimumGapMinutes: 30,
      },
      { ...context, progress },
    );
    expect(timing.get("next")).toMatchObject({ sleepRisk, shortGap });
  },
);
it.each([
  { stage: 2, step: 1, counted: 0, asOf: "2026-11-02T12:00:00Z" },
  { stage: 2, step: 2, counted: 2, asOf: "2026-11-02T12:00:00Z" },
])(
  "uses saved progress as the timing origin when a claim is pending: %j",
  (progress) => {
    const rows = projectStages(
      [record("early", "12:15"), record("later", "13:00")],
      0,
      progress,
    ).rows;
    const timing = finishTimings(
      rows,
      { ...emptyPlanner("UTC"), minimumGapMinutes: 30 },
      { ...context, progress },
    );
    expect(timing.get("early")).toMatchObject({
      gapMinutes: 15,
      shortGap: true,
    });
    expect(timing.get("later")?.shortGap).toBe(false);
  },
);
it("resolves the opening event boundary in the selected timezone across daylight saving", () => {
  const finishes = [
    { ...record("early", "00:30"), endAt: "2026-11-01T07:30:00Z" },
    { ...record("later", "07:30"), endAt: "2026-11-01T15:30:00Z" },
  ];
  const timing = finishTimings(
    projectStages(finishes, 0).rows,
    {
      ...emptyPlanner("America/Los_Angeles"),
      sleepStart: "23:00",
      sleepEnd: "07:00",
      minimumGapMinutes: 30,
    },
    context,
  );
  expect(timing.get("early")).toMatchObject({
    gapMinutes: 30,
    sleepRisk: true,
  });
  expect(timing.get("later")).toMatchObject({
    sleepRisk: false,
    shortGap: false,
  });
});
it.each([
  ["America/New_York", "2026-03-08T06:30:00Z", "2026-03-08T12:00:00Z"],
  ["Australia/Lord_Howe", "2026-10-03T15:00:00Z", "2026-10-03T21:00:00Z"],
])(
  "retains awake time across forward clock changes in %s",
  (timezone, from, until) => {
    expect(
      awakeMinutesBetween(
        Date.parse(from),
        Date.parse(until),
        timezone,
        "23:00",
        "07:00",
      ),
    ).toBe(60);
  },
);
it("flags simultaneous ends across a task boundary even with no minimum gap configured", () => {
  const finishes = ["a", "b", "c", "d", "e"].map((id) => record(id, "12:00"));
  const timing = finishTimings(
    projectStages(finishes, 0).rows,
    emptyPlanner("UTC"),
    context,
  );
  expect(
    finishes
      .filter((finish) => timing.get(finish.id)?.shortGap)
      .map((finish) => finish.id),
  ).toEqual(["c", "d", "e"]);
});
it("flags every mushroom ending before a sleeping user can claim the previous task", () => {
  const rows = projectStages(
    [
      record("a", "00:00"),
      record("b", "01:00"),
      record("c", "02:00"),
      record("d", "03:00"),
    ],
    0,
  ).rows;
  const timing = finishTimings(
    rows,
    { ...emptyPlanner("UTC"), sleepStart: "23:00", sleepEnd: "07:00" },
    context,
  );
  expect(
    ["a", "b", "c", "d"].filter((id) => timing.get(id)?.sleepRisk),
  ).toEqual(["c", "d"]);
});
it("checks every mushroom against the previous task's completion, not the preceding mushroom", () => {
  const rows = projectStages(
    [
      record("a", "10:00"),
      record("b", "11:00"),
      record("c", "11:05"),
      record("d", "11:10"),
    ],
    0,
  ).rows;
  const timing = finishTimings(
    rows,
    { ...emptyPlanner("UTC"), minimumGapMinutes: 30 },
    context,
  );
  expect(["a", "b", "c", "d"].filter((id) => timing.get(id)?.shortGap)).toEqual(
    ["c", "d"],
  );
});
it("stops flagging later mushrooms in a task once the reward-claim window has passed", () => {
  const rows = projectStages(
    [
      record("a", "00:00"),
      record("b", "01:00"),
      record("c", "02:00"),
      record("d", "07:30"),
    ],
    0,
  ).rows;
  const timing = finishTimings(
    rows,
    {
      ...emptyPlanner("UTC"),
      sleepStart: "23:00",
      sleepEnd: "07:00",
      minimumGapMinutes: 30,
    },
    context,
  );
  expect(timing.get("c")?.sleepRisk).toBe(true);
  expect(timing.get("d")?.sleepRisk).toBe(false);
});
it("does not restart the minimum gap after another mushroom in the same task", () => {
  const rows = projectStages(
    [
      record("a", "10:00"),
      record("b", "11:00"),
      record("c", "11:05"),
      record("d", "11:30"),
    ],
    0,
  ).rows;
  const timing = finishTimings(
    rows,
    { ...emptyPlanner("UTC"), minimumGapMinutes: 30 },
    context,
  );
  expect(timing.get("c")?.shortGap).toBe(true);
  expect(timing.get("d")).toMatchObject({ gapMinutes: 30, shortGap: false });
});
it("allows a claim before bed but flags the next task's ends until wake-up", () => {
  const finishes = [
    record("a", "20:00"),
    record("b", "22:00"),
    ...["01:00", "02:00", "03:00", "04:00", "08:00"].map((time, index) => ({
      ...record(String(index), time),
      endAt: `2026-11-03T${time}:00Z`,
    })),
  ];
  const timing = finishTimings(
    projectStages(finishes, 0).rows,
    { ...emptyPlanner("UTC"), sleepStart: "23:00", sleepEnd: "07:00" },
    context,
  );
  expect(
    finishes
      .filter((finish) => timing.get(finish.id)?.sleepRisk)
      .map((finish) => finish.id),
  ).toEqual(["2", "3"]);
});
it("allows clustered finishes in the first task and checks all ends in the next task", () => {
  const rows = projectStages(
    [
      record("a", "00:00"),
      record("b", "00:01"),
      record("c", "00:20"),
      record("d", "00:21"),
    ],
    0,
  ).rows;
  const timing = finishTimings(
    rows,
    { ...emptyPlanner("UTC"), minimumGapMinutes: 30 },
    context,
  );
  expect(timing.get("a")?.shortGap).toBe(false);
  expect(timing.get("b")?.shortGap).toBe(false);
  expect(timing.get("c")?.shortGap).toBe(true);
  expect(timing.get("d")?.shortGap).toBe(true);
});
it("does not mark ordinary sleep-time finishes; only blocked task changes have sleep risk", () => {
  const rows = projectStages(
    [record("a", "00:00"), record("b", "01:00"), record("c", "02:00")],
    0,
  ).rows;
  const timing = finishTimings(
    rows,
    { ...emptyPlanner("UTC"), sleepStart: "23:00", sleepEnd: "07:00" },
    context,
  );
  expect(timing.get("a")?.sleepRisk).toBe(false);
  expect(timing.get("b")?.sleepRisk).toBe(false);
  expect(timing.get("c")?.sleepRisk).toBe(true);
});
it("checks each task boundary separately when one sleep period spans multiple mushroom requirements", () => {
  // Quotas are 2, 2, then 3: all ends after the first quota fall before wake-up.
  const finishes = ["a", "b", "c", "d", "e", "f", "g"].map((id, index) =>
    record(id, `0${index}:00`),
  );
  const rows = projectStages(finishes, 0).rows;
  const timing = finishTimings(
    rows,
    {
      ...emptyPlanner("UTC"),
      sleepStart: "23:00",
      sleepEnd: "07:00",
      minimumGapMinutes: 30,
    },
    context,
  );
  expect(
    finishes
      .filter((finish) => timing.get(finish.id)?.sleepRisk)
      .map((finish) => finish.id),
  ).toEqual(["c", "d", "e", "f", "g"]);
  expect(
    rows.flatMap((row) => row.finishes).map((finish) => finish.id),
  ).toEqual(finishes.map((finish) => finish.id));
});
it("allows a task change before bed and checks its elapsed gap independently", () => {
  const rows = projectStages(
    [
      record("a", "21:00"),
      record("b", "22:50"),
      { ...record("c", "02:00"), endAt: "2026-11-03T02:00:00Z" },
    ],
    0,
  ).rows;
  const base = {
    ...emptyPlanner("UTC"),
    sleepStart: "23:00",
    sleepEnd: "07:00",
  };
  expect(finishTimings(rows, base, context).get("c")?.sleepRisk).toBe(false);
  expect(
    finishTimings(rows, { ...base, minimumGapMinutes: 30 }, context).get("c"),
  ).toMatchObject({ sleepRisk: false, shortGap: false });
  expect(
    finishTimings(rows, { ...base, minimumGapMinutes: 300 }, context).get("c"),
  ).toMatchObject({ sleepRisk: false, shortGap: true });
});
it("calculates sleep overlap and midnight across daylight saving without a live clock", () => {
  expect(
    awakeMinutesBetween(
      Date.parse("2026-11-01T06:00Z"),
      Date.parse("2026-11-01T16:00Z"),
      "America/Los_Angeles",
      "23:00",
      "07:00",
    ),
  ).toBe(60);
  expect(
    new Date(
      nextLocalMidnight(Date.parse("2026-11-01T07:30Z"), "America/Los_Angeles"),
    ).toISOString(),
  ).toBe("2026-11-02T08:00:00.000Z");
});
