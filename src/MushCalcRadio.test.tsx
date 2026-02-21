import dayjs, { Dayjs } from "dayjs";
import { Mushroom, mushrooms } from "./types";

// Test the recomputeDerived logic in isolation
// Extract the pure function logic for testing

interface FormState {
  derived: "health" | "startTime" | "endTime" | "ap" | null;
  mush: Mushroom | null;
  health: number;
  pikminAp: number;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
}

// Copy of recomputeDerived for testing (ideally this would be extracted to a separate file)
const recomputeDerived = (state: FormState): FormState => {
  const { derived, mush, health, pikminAp, startTime, endTime } = state;

  if (!mush) return state;

  if (derived === "ap" && startTime && endTime) {
    const timeEstimate = endTime.diff(startTime, "second");
    if (timeEstimate <= 0) return { ...state, pikminAp: 0 };
    return { ...state, pikminAp: (health * 100) / timeEstimate };
  }
  if (derived === "health" && startTime && endTime && pikminAp) {
    const timeEstimate = endTime.diff(startTime, "second");
    return { ...state, health: Math.ceil((pikminAp * timeEstimate) / 100) };
  }
  if (derived === "startTime" && endTime && pikminAp) {
    const timeEstimate = (health * 100) / pikminAp;
    return { ...state, startTime: endTime.subtract(timeEstimate, "second") };
  }
  if (derived === "endTime" && startTime && pikminAp) {
    const timeEstimate = (health * 100) / pikminAp;
    return { ...state, endTime: startTime.add(timeEstimate, "second") };
  }
  return state;
};

describe("recomputeDerived", () => {
  const baseMush = mushrooms[0];

  describe("when derived is null", () => {
    it("returns state unchanged", () => {
      const state: FormState = {
        derived: null,
        mush: baseMush,
        health: 1000,
        pikminAp: 100,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: dayjs("2024-01-01T12:00:00"),
      };

      const result = recomputeDerived(state);
      expect(result).toEqual(state);
    });
  });

  describe("when mush is null", () => {
    it("returns state unchanged regardless of derived value", () => {
      const state: FormState = {
        derived: "ap",
        mush: null,
        health: 1000,
        pikminAp: 100,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: dayjs("2024-01-01T12:00:00"),
      };

      const result = recomputeDerived(state);
      expect(result).toEqual(state);
    });
  });

  describe("derived = 'ap'", () => {
    it("calculates AP from health and time range", () => {
      const state: FormState = {
        derived: "ap",
        mush: baseMush,
        health: 1000,
        pikminAp: 0, // Will be calculated
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: dayjs("2024-01-01T10:16:40"), // 1000 seconds
      };

      const result = recomputeDerived(state);
      // AP = (1000 * 100) / 1000 = 100
      expect(result.pikminAp).toBe(100);
    });

    it("returns 0 AP when time range is zero", () => {
      const sameTime = dayjs("2024-01-01T10:00:00");
      const state: FormState = {
        derived: "ap",
        mush: baseMush,
        health: 1000,
        pikminAp: 50,
        startTime: sameTime,
        endTime: sameTime,
      };

      const result = recomputeDerived(state);
      expect(result.pikminAp).toBe(0);
    });

    it("does not compute when startTime is null", () => {
      const state: FormState = {
        derived: "ap",
        mush: baseMush,
        health: 1000,
        pikminAp: 50,
        startTime: null,
        endTime: dayjs("2024-01-01T12:00:00"),
      };

      const result = recomputeDerived(state);
      expect(result.pikminAp).toBe(50); // Unchanged
    });

    it("does not compute when endTime is null", () => {
      const state: FormState = {
        derived: "ap",
        mush: baseMush,
        health: 1000,
        pikminAp: 50,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: null,
      };

      const result = recomputeDerived(state);
      expect(result.pikminAp).toBe(50); // Unchanged
    });
  });

  describe("derived = 'health'", () => {
    it("calculates health from AP and time range", () => {
      const state: FormState = {
        derived: "health",
        mush: baseMush,
        health: 0, // Will be calculated
        pikminAp: 100,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: dayjs("2024-01-01T10:16:40"), // 1000 seconds
      };

      const result = recomputeDerived(state);
      // Health = ceil((100 * 1000) / 100) = 1000
      expect(result.health).toBe(1000);
    });

    it("rounds health up", () => {
      const state: FormState = {
        derived: "health",
        mush: baseMush,
        health: 0,
        pikminAp: 33,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: dayjs("2024-01-01T10:00:10"), // 10 seconds
      };

      const result = recomputeDerived(state);
      // Health = ceil((33 * 10) / 100) = ceil(3.3) = 4
      expect(result.health).toBe(4);
    });

    it("does not compute when pikminAp is 0", () => {
      const state: FormState = {
        derived: "health",
        mush: baseMush,
        health: 500,
        pikminAp: 0,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: dayjs("2024-01-01T12:00:00"),
      };

      const result = recomputeDerived(state);
      expect(result.health).toBe(500); // Unchanged
    });
  });

  describe("derived = 'startTime'", () => {
    it("calculates start time from health, AP, and end time", () => {
      const endTime = dayjs("2024-01-01T12:00:00");
      const state: FormState = {
        derived: "startTime",
        mush: baseMush,
        health: 1000,
        pikminAp: 100,
        startTime: null, // Will be calculated
        endTime,
      };

      const result = recomputeDerived(state);
      // Time = (1000 * 100) / 100 = 1000 seconds before end
      const expectedStart = endTime.subtract(1000, "second");
      expect(result.startTime?.unix()).toBe(expectedStart.unix());
    });

    it("does not compute when endTime is null", () => {
      const state: FormState = {
        derived: "startTime",
        mush: baseMush,
        health: 1000,
        pikminAp: 100,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: null,
      };

      const result = recomputeDerived(state);
      expect(result.startTime?.unix()).toBe(dayjs("2024-01-01T10:00:00").unix());
    });
  });

  describe("derived = 'endTime'", () => {
    it("calculates end time from health, AP, and start time", () => {
      const startTime = dayjs("2024-01-01T10:00:00");
      const state: FormState = {
        derived: "endTime",
        mush: baseMush,
        health: 1000,
        pikminAp: 100,
        startTime,
        endTime: null, // Will be calculated
      };

      const result = recomputeDerived(state);
      // Time = (1000 * 100) / 100 = 1000 seconds after start
      const expectedEnd = startTime.add(1000, "second");
      expect(result.endTime?.unix()).toBe(expectedEnd.unix());
    });

    it("does not compute when startTime is null", () => {
      const state: FormState = {
        derived: "endTime",
        mush: baseMush,
        health: 1000,
        pikminAp: 100,
        startTime: null,
        endTime: dayjs("2024-01-01T12:00:00"),
      };

      const result = recomputeDerived(state);
      expect(result.endTime?.unix()).toBe(dayjs("2024-01-01T12:00:00").unix());
    });
  });

  describe("edge cases", () => {
    it("handles very large health values", () => {
      const state: FormState = {
        derived: "ap",
        mush: baseMush,
        health: 10000000, // 10 million
        pikminAp: 0,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: dayjs("2024-01-01T10:16:40"), // 1000 seconds
      };

      const result = recomputeDerived(state);
      expect(result.pikminAp).toBe(1000000); // (10000000 * 100) / 1000
    });

    it("handles very small time differences", () => {
      const state: FormState = {
        derived: "ap",
        mush: baseMush,
        health: 1000,
        pikminAp: 0,
        startTime: dayjs("2024-01-01T10:00:00"),
        endTime: dayjs("2024-01-01T10:00:01"), // 1 second
      };

      const result = recomputeDerived(state);
      expect(result.pikminAp).toBe(100000); // (1000 * 100) / 1
    });
  });
});

describe("handleMushChange logic", () => {
  // Simulates the logic from handleMushChange
  const computeNewAp = (currentAp: number, mushMinimum: number): number => {
    return currentAp !== 2 ? currentAp : mushMinimum;
  };

  it("all mushrooms have positive health values", () => {
    mushrooms.forEach(mush => {
      expect(mush.value).toBeGreaterThan(0);
    });
  });

  it("some mushrooms have minimum AP greater than default", () => {
    const mushWithHigherMin = mushrooms.find(m => m.minimum > 2);
    expect(mushWithHigherMin).toBeDefined();
    expect(mushWithHigherMin?.minimum).toBeGreaterThan(2);
  });

  it("uses minimum AP from mushroom when current AP is default (2)", () => {
    const result = computeNewAp(2, 1040);
    expect(result).toBe(1040);
  });

  it("preserves existing AP when it differs from default", () => {
    const result = computeNewAp(500, 1040);
    expect(result).toBe(500);
  });
});

describe("isValid logic", () => {
  const isValid = (mush: any, startTime: any, endTime: any, health: number, pikminAp: number) =>
    !!(mush && startTime && endTime && health > 0 && pikminAp > 0);

  it("requires mush to be selected", () => {
    expect(isValid(null, dayjs(), dayjs(), 100, 100)).toBe(false);
    expect(isValid(mushrooms[0], dayjs(), dayjs(), 100, 100)).toBe(true);
  });

  it("requires both start and end times", () => {
    expect(isValid(mushrooms[0], null, dayjs(), 100, 100)).toBe(false);
    expect(isValid(mushrooms[0], dayjs(), null, 100, 100)).toBe(false);
  });

  it("requires positive health and AP", () => {
    expect(isValid(mushrooms[0], dayjs(), dayjs(), 0, 100)).toBe(false);
    expect(isValid(mushrooms[0], dayjs(), dayjs(), 100, 0)).toBe(false);
    expect(isValid(mushrooms[0], dayjs(), dayjs(), -1, 100)).toBe(false);
  });
});
