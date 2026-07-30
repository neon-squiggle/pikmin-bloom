import dayjs from "dayjs";

import {
  calculateBattleDurationSeconds,
  durationToSeconds,
} from "./helpers";
import {
  checkSnapshotDuration,
  createExistingMushroomSeed,
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

  it("leaves the form unchanged until a mushroom is selected", () => {
    const state = createState({ derived: "ap", mush: null });
    expect(recomputeDerived(state)).toEqual(state);
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
    expect(result.endTime?.unix()).toBe(
      startTime.add(1000, "second").unix(),
    );
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

describe("checkSnapshotDuration", () => {
  it("flags values whose implied and reported durations materially disagree", () => {
    const result = checkSnapshotDuration(100, 1000, 86400);

    expect(result).not.toBeNull();
    expect(result?.calculatedSeconds).toBe(1000);
    expect(result?.isConsistent).toBe(false);
  });

  it("accepts differences up to five minutes as rounding", () => {
    expect(checkSnapshotDuration(100, 1000, 1300)?.isConsistent).toBe(true);
  });

  it("flags differences greater than five minutes", () => {
    expect(checkSnapshotDuration(100, 1000, 1301)?.isConsistent).toBe(false);
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

describe("createExistingMushroomSeed", () => {
  const largeGray = mushrooms.find(({ key }) => key === "lg");

  if (!largeGray) {
    throw new Error("Large Gray mushroom fixture is missing");
  }

  it("rolls a fresh 350 AP Large Gray into exactly ten days", () => {
    const snapshotTime = dayjs("2024-01-01T12:00:00");
    const seed = createExistingMushroomSeed(
      createState({
        mush: largeGray,
        health: largeGray.value,
        pikminAp: 350,
        startTime: snapshotTime,
      }),
      snapshotTime,
    );

    expect(seed).toEqual({
      currentAp: 350,
      healthRemaining: 3024000,
      timeRemaining: { days: 10, hours: 0, minutes: 0, seconds: 0 },
    });
  });

  it("subtracts elapsed damage while preserving the projected finish", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    const snapshotTime = startTime.add(1, "hour");
    const seed = createExistingMushroomSeed(
      createState({
        mush: largeGray,
        health: largeGray.value,
        pikminAp: 350,
        startTime,
      }),
      snapshotTime,
    );

    expect(seed).toEqual({
      currentAp: 350,
      healthRemaining: 3011400,
      timeRemaining: { days: 9, hours: 23, minutes: 0, seconds: 0 },
    });
    expect(snapshotTime.add(9, "day").add(23, "hour").unix()).toBe(
      startTime.add(10, "day").unix(),
    );
  });

  it("rejects a mushroom that has not started", () => {
    const snapshotTime = dayjs("2024-01-01T12:00:00");
    expect(
      createExistingMushroomSeed(
        createState({ startTime: snapshotTime.add(1, "minute") }),
        snapshotTime,
      ),
    ).toBeNull();
  });

  it("rejects a finished mushroom", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    expect(
      createExistingMushroomSeed(
        createState({
          health: 1000,
          pikminAp: 100,
          startTime,
        }),
        startTime.add(1000, "second"),
      ),
    ).toBeNull();
  });

  it("rejects non-finite state instead of producing an invalid duration", () => {
    expect(
      createExistingMushroomSeed(
        createState({ pikminAp: Number.POSITIVE_INFINITY }),
        dayjs("2024-01-01T10:00:00"),
      ),
    ).toBeNull();
  });

  it("preserves remaining duration within one second for every mushroom", () => {
    const snapshotTime = dayjs("2024-01-10T12:00:00");

    mushrooms.forEach((mushroom) => {
      const ap = Math.max(mushroom.minimum, 350);
      const fullDuration = calculateBattleDurationSeconds(mushroom.value, ap);
      if (fullDuration == null) throw new Error("Invalid mushroom fixture");

      const elapsedSeconds = Math.min(12345, Math.floor(fullDuration / 2));
      const seed = createExistingMushroomSeed(
        createState({
          mush: mushroom,
          health: mushroom.value,
          pikminAp: ap,
          startTime: snapshotTime.subtract(elapsedSeconds, "second"),
        }),
        snapshotTime,
      );
      if (!seed) throw new Error(`Could not roll over ${mushroom.label}`);

      const expectedSecondsRemaining = fullDuration - elapsedSeconds;
      const actualSecondsRemaining = durationToSeconds(seed.timeRemaining);
      expect(actualSecondsRemaining).toBeLessThanOrEqual(
        expectedSecondsRemaining,
      );
      expect(actualSecondsRemaining).toBeGreaterThan(
        expectedSecondsRemaining - 1,
      );
    });
  });
});
