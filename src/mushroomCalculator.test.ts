import dayjs from "dayjs";

import {
  getApForSelectedMushroom,
  NewMushroomFormState,
  recomputeDerived,
} from "./mushroomCalculator";
import { mushrooms } from "./types";

const baseMushroom = mushrooms[0];

const createState = (
  overrides: Partial<NewMushroomFormState> = {},
): NewMushroomFormState => ({
  derived: null,
  mush: baseMushroom,
  health: 1000,
  pikminAp: 100,
  startTime: dayjs("2024-01-01T10:00:00"),
  endTime: dayjs("2024-01-01T10:16:40"),
  ...overrides,
});

describe("new mushroom calculations", () => {
  it("leaves the form unchanged when no field is derived", () => {
    const state = createState();
    expect(recomputeDerived(state)).toEqual(state);
  });

  it("clears the derived result when the mushroom is cleared", () => {
    const state = createState({ derived: "ap", mush: null });
    expect(Number.isNaN(recomputeDerived(state).pikminAp)).toBe(true);
  });

  it("derives AP from health and elapsed time", () => {
    const result = recomputeDerived(
      createState({ derived: "ap", pikminAp: 0 }),
    );
    expect(result.pikminAp).toBe(100);
  });

  it("derives health and rounds it up to a whole health point", () => {
    const result = recomputeDerived(
      createState({
        derived: "health",
        health: 0,
        pikminAp: 33,
        endTime: dayjs("2024-01-01T10:00:10"),
      }),
    );
    expect(result.health).toBe(4);
  });

  it("derives the start time from health, AP, and end time", () => {
    const endTime = dayjs("2024-01-01T12:00:00");
    const result = recomputeDerived(
      createState({
        derived: "startTime",
        startTime: null,
        endTime,
      }),
    );
    expect(result.startTime?.unix()).toBe(
      endTime.subtract(1000, "second").unix(),
    );
  });

  it("derives the end time from health, AP, and start time", () => {
    const startTime = dayjs("2024-01-01T10:00:00");
    const result = recomputeDerived(
      createState({
        derived: "endTime",
        startTime,
        endTime: null,
      }),
    );
    expect(result.endTime?.unix()).toBe(startTime.add(1000, "second").unix());
  });

  it("does not replace a derived date until its inputs are valid", () => {
    const state = createState({
      derived: "endTime",
      pikminAp: 0,
      endTime: null,
    });
    expect(recomputeDerived(state)).toEqual(state);
  });

  it("returns zero AP for an invalid time range", () => {
    const time = dayjs("2024-01-01T10:00:00");
    const result = recomputeDerived(
      createState({
        derived: "ap",
        startTime: time,
        endTime: time,
      }),
    );
    expect(result.pikminAp).toBe(0);
  });
});

describe("mushroom selection", () => {
  it("uses the mushroom minimum when AP is still at the default", () => {
    expect(getApForSelectedMushroom(2, mushrooms[16])).toBe(
      mushrooms[16].minimum,
    );
  });

  it("preserves a value the user already entered", () => {
    expect(getApForSelectedMushroom(500, mushrooms[16])).toBe(500);
  });

  it("defines positive health and minimum AP for every mushroom", () => {
    mushrooms.forEach((mushroom) => {
      expect(mushroom.value).toBeGreaterThan(0);
      expect(mushroom.minimum).toBeGreaterThan(0);
    });
  });
});

it("clears a stale calculated finish when the entered AP becomes invalid", () => {
  const result = recomputeDerived(
    createState({ derived: "endTime", pikminAp: Number.NaN }),
  );
  expect(result.endTime).toBeNull();
});

it.each([
  ["ap", { endTime: null }, "pikminAp"],
  ["ap", { health: Number.NaN }, "pikminAp"],
  ["health", { pikminAp: Number.NaN }, "health"],
  ["health", { startTime: null }, "health"],
] as const)(
  "clears calculated %s when a dependency is missing",
  (derived, missing, field) => {
    expect(
      Number.isNaN(
        recomputeDerived(createState({ derived, ...missing }))[field],
      ),
    ).toBe(true);
  },
);
