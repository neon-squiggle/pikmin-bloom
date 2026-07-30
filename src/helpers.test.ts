import dayjs from "dayjs";
import {
  calculateStartTime,
  calculateEndTime,
  calculateHealthTimeRange,
  calculateApTimeRange,
  calculateBattleDurationSeconds,
  diffToTimeRemaining,
  isInvalidDuration,
  durationToSeconds,
  parseTimeRemaining,
  calculateAdditionalAp,
  calculateApAdditionDelay,
  secondsToDuration,
  calculateRemainingHealth,
} from "./helpers";

describe("calculateStartTime", () => {
  it("calculates start time given health, ap, and end time", () => {
    const endTime = dayjs("2024-01-01T12:00:00");
    const health = 1000;
    const ap = 100;
    // timeEstimate = (1000 * 100) / 100 = 1000 seconds
    const result = calculateStartTime(health, ap, endTime);
    expect(result.unix()).toBe(endTime.subtract(1000, "second").unix());
  });

  it("handles high AP values", () => {
    const endTime = dayjs("2024-01-01T12:00:00");
    const health = 1000;
    const ap = 1000;
    // timeEstimate = (1000 * 100) / 1000 = 100 seconds
    const result = calculateStartTime(health, ap, endTime);
    expect(result.unix()).toBe(endTime.subtract(100, "second").unix());
  });

  it("does not create an invalid date when AP is zero", () => {
    const endTime = dayjs("2024-01-01T12:00:00");
    expect(calculateStartTime(1000, 0, endTime)).toEqual(endTime);
  });
});

describe("calculateEndTime", () => {
  it("calculates end time given health, ap, and start time", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    const health = 1000;
    const ap = 100;
    // timeEstimate = (1000 * 100) / 100 = 1000 seconds
    const result = calculateEndTime(health, ap, startTime);
    expect(result.unix()).toBe(startTime.add(1000, "second").unix());
  });

  it.each([
    [1000, 100],
    [3024000, 350],
    [13662000, 1000],
  ])(
    "round-trips health %p and AP %p through the projected end",
    (health, ap) => {
      const startTime = dayjs("2024-01-01T12:00:00");
      const endTime = calculateEndTime(health, ap, startTime);
      expect(calculateApTimeRange(health, startTime, endTime)).toBeCloseTo(
        ap,
        10,
      );
      expect(calculateStartTime(health, ap, endTime).valueOf()).toBe(
        startTime.valueOf(),
      );
    },
  );
});

describe("calculateHealthTimeRange", () => {
  it("calculates health given ap and time range", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    const endTime = dayjs("2024-01-01T12:16:40"); // 1000 seconds later
    const ap = 100;
    // health = ceil((100 * 1000) / 100) = 1000
    const result = calculateHealthTimeRange(ap, startTime, endTime);
    expect(result).toBe(1000);
  });

  it("rounds up health", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    const endTime = dayjs("2024-01-01T12:00:10"); // 10 seconds
    const ap = 33;
    // health = ceil((33 * 10) / 100) = ceil(3.3) = 4
    const result = calculateHealthTimeRange(ap, startTime, endTime);
    expect(result).toBe(4);
  });

  it("returns zero for reversed times or invalid AP", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    expect(
      calculateHealthTimeRange(
        100,
        startTime,
        startTime.subtract(1, "second"),
      ),
    ).toBe(0);
    expect(
      calculateHealthTimeRange(Number.NaN, startTime, startTime.add(1, "hour")),
    ).toBe(0);
  });
});

describe("calculateBattleDurationSeconds", () => {
  it("uses health divided by AP multiplied by 100", () => {
    expect(calculateBattleDurationSeconds(3024000, 350)).toBe(864000);
  });

  it.each([
    [0, 100],
    [-1, 100],
    [100, 0],
    [100, -1],
    [Number.NaN, 100],
    [100, Number.POSITIVE_INFINITY],
  ])("rejects invalid health/AP values (%p, %p)", (health, ap) => {
    expect(calculateBattleDurationSeconds(health, ap)).toBeNull();
  });
});

describe("calculateApTimeRange", () => {
  it("calculates ap given health and time range", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    const endTime = dayjs("2024-01-01T12:16:40"); // 1000 seconds later
    const health = 1000;
    // ap = (1000 * 100) / 1000 = 100
    const result = calculateApTimeRange(health, startTime, endTime);
    expect(result).toBe(100);
  });

  it("returns 0 when time range is zero", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    const endTime = dayjs("2024-01-01T12:00:00");
    const health = 1000;
    expect(calculateApTimeRange(health, startTime, endTime)).toBe(0);
  });

  it("returns 0 when time range is negative (end before start)", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    const endTime = dayjs("2024-01-01T11:00:00"); // 1 hour before
    const health = 1000;
    expect(calculateApTimeRange(health, startTime, endTime)).toBe(0);
  });

  it("does not round the result", () => {
    const startTime = dayjs("2024-01-01T12:00:00");
    const endTime = dayjs("2024-01-01T12:00:30"); // 30 seconds
    const health = 1000;
    // ap = (1000 * 100) / 30 = 3333.33...
    const result = calculateApTimeRange(health, startTime, endTime);
    expect(result).toBeCloseTo(3333.33, 1);
  });
});

describe("diffToTimeRemaining", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calculates remaining time from now to target", () => {
    // Target is 1 day, 2 hours, 30 min, 45 sec from mocked "now"
    const now = dayjs();
    const target = now.add(1, "day").add(2, "hour").add(30, "minute").add(45, "second");
    const result = diffToTimeRemaining(target);
    expect(result).toEqual({
      days: 1,
      hours: 2,
      minutes: 30,
      seconds: 45,
    });
  });

  it("returns zeros when target is in the past", () => {
    const now = dayjs();
    const target = now.subtract(1, "hour");
    const result = diffToTimeRemaining(target);
    expect(result).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("handles exact match (target is now)", () => {
    const target = dayjs();
    const result = diffToTimeRemaining(target);
    expect(result).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("correctly breaks down hours that don't overflow into days", () => {
    const now = dayjs();
    const target = now.add(25, "hour"); // Should be 1 day, 1 hour
    const result = diffToTimeRemaining(target);
    expect(result).toEqual({
      days: 1,
      hours: 1,
      minutes: 0,
      seconds: 0,
    });
  });
});

describe("isInvalidDuration", () => {
  it("returns true when all values are zero", () => {
    expect(isInvalidDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 })).toBe(true);
  });

  it("returns false when any value is non-zero", () => {
    expect(isInvalidDuration({ days: 1, hours: 0, minutes: 0, seconds: 0 })).toBe(false);
    expect(isInvalidDuration({ days: 0, hours: 1, minutes: 0, seconds: 0 })).toBe(false);
    expect(isInvalidDuration({ days: 0, hours: 0, minutes: 1, seconds: 0 })).toBe(false);
    expect(isInvalidDuration({ days: 0, hours: 0, minutes: 0, seconds: 1 })).toBe(false);
  });

  it("rejects negative and non-finite durations", () => {
    expect(
      isInvalidDuration({ days: -1, hours: 0, minutes: 0, seconds: 0 }),
    ).toBe(true);
    expect(
      isInvalidDuration({
        days: Number.NaN,
        hours: 0,
        minutes: 0,
        seconds: 0,
      }),
    ).toBe(true);
  });
});

describe("durationToSeconds", () => {
  it("converts all duration fields to seconds", () => {
    expect(
      durationToSeconds({ days: 1, hours: 2, minutes: 3, seconds: 4 }),
    ).toBe(93784);
  });
});

describe("parseTimeRemaining", () => {
  it("requires all four fields and a positive total", () => {
    expect(
      parseTimeRemaining({
        days: null,
        hours: 1,
        minutes: 0,
        seconds: 0,
      }),
    ).toBeNull();
    expect(
      parseTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 }),
    ).toBeNull();
  });

  it("accepts a complete, positive duration", () => {
    expect(
      parseTimeRemaining({ days: 1, hours: 2, minutes: 3, seconds: 4 }),
    ).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4 });
  });

  it("rejects fractions and out-of-range clock fields", () => {
    expect(
      parseTimeRemaining({ days: 0, hours: 1.5, minutes: 0, seconds: 0 }),
    ).toBeNull();
    expect(
      parseTimeRemaining({ days: 0, hours: 24, minutes: 0, seconds: 0 }),
    ).toBeNull();
    expect(
      parseTimeRemaining({ days: 0, hours: 0, minutes: 60, seconds: 0 }),
    ).toBeNull();
  });
});

describe("secondsToDuration", () => {
  it("converts seconds to normalized duration fields", () => {
    expect(secondsToDuration(93784)).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
  });

  it("returns a zero duration for non-finite values", () => {
    expect(secondsToDuration(Number.POSITIVE_INFINITY)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});

describe("calculateRemainingHealth", () => {
  it("subtracts damage already dealt without rounding", () => {
    expect(calculateRemainingHealth(1000, 125, 120)).toBe(850);
  });

  it("does not consume health before the mushroom starts", () => {
    expect(calculateRemainingHealth(1000, 125, -120)).toBe(1000);
  });

  it("does not return negative health", () => {
    expect(calculateRemainingHealth(1000, 1000, 1000)).toBe(0);
  });
});

describe("calculateAdditionalAp", () => {
  it("returns the raw additional AP needed when added immediately", () => {
    expect(
      calculateAdditionalAp({
        currentAp: 100,
        healthRemaining: 1000,
        secondsUntilTarget: 800,
        secondsUntilApAdded: 0,
      }),
    ).toBe(25);
  });

  it("requires more AP when it is added later", () => {
    expect(
      calculateAdditionalAp({
        currentAp: 100,
        healthRemaining: 1000,
        secondsUntilTarget: 800,
        secondsUntilApAdded: 400,
      }),
    ).toBe(50);
  });

  it("does not round fractional AP", () => {
    expect(
      calculateAdditionalAp({
        currentAp: 100,
        healthRemaining: 1000,
        secondsUntilTarget: 700,
        secondsUntilApAdded: 250,
      }),
    ).toBeCloseTo(66.66666666666667);
  });

  it("returns zero when current AP already meets the target", () => {
    expect(
      calculateAdditionalAp({
        currentAp: 100,
        healthRemaining: 1000,
        secondsUntilTarget: 1000,
        secondsUntilApAdded: 0,
      }),
    ).toBe(0);
  });

  it("returns null for an addition at or after the target", () => {
    expect(
      calculateAdditionalAp({
        currentAp: 100,
        healthRemaining: 1000,
        secondsUntilTarget: 800,
        secondsUntilApAdded: 800,
      }),
    ).toBeNull();
  });

  it("rejects non-finite inputs", () => {
    expect(
      calculateAdditionalAp({
        currentAp: 100,
        healthRemaining: Number.NaN,
        secondsUntilTarget: 800,
        secondsUntilApAdded: 0,
      }),
    ).toBeNull();
  });

  it("is the algebraic inverse of AP addition delay", () => {
    const input = {
      currentAp: 100,
      healthRemaining: 3000,
      secondsUntilTarget: 2700,
      additionalAp: 20,
    };
    const delay = calculateApAdditionDelay(input);
    expect(delay).not.toBeNull();
    expect(
      calculateAdditionalAp({
        currentAp: input.currentAp,
        healthRemaining: input.healthRemaining,
        secondsUntilTarget: input.secondsUntilTarget,
        secondsUntilApAdded: delay as number,
      }),
    ).toBeCloseTo(input.additionalAp, 10);
  });

  it("produces exactly enough cumulative AP-seconds to hit the target", () => {
    const currentAp = 350;
    const healthRemaining = 3024000;
    const secondsUntilTarget = 5 * 86400;
    const secondsUntilApAdded = 2 * 86400;
    const additionalAp = calculateAdditionalAp({
      currentAp,
      healthRemaining,
      secondsUntilTarget,
      secondsUntilApAdded,
    });

    expect(additionalAp).not.toBeNull();
    const cumulativeApSeconds =
      currentAp * secondsUntilTarget +
      (additionalAp as number) *
        (secondsUntilTarget - secondsUntilApAdded);
    expect(cumulativeApSeconds).toBeCloseTo(healthRemaining * 100, 5);
  });
});

describe("calculateApAdditionDelay", () => {
  it("returns when the chosen AP must be added to meet the target", () => {
    expect(
      calculateApAdditionDelay({
        currentAp: 100,
        healthRemaining: 3000,
        secondsUntilTarget: 2700,
        additionalAp: 20,
      }),
    ).toBe(1200);
  });

  it("clamps insufficient AP to an immediate addition", () => {
    expect(
      calculateApAdditionDelay({
        currentAp: 100,
        healthRemaining: 3000,
        secondsUntilTarget: 2700,
        additionalAp: 5,
      }),
    ).toBe(0);
  });

  it("returns null for invalid AP", () => {
    expect(
      calculateApAdditionDelay({
        currentAp: 100,
        healthRemaining: 3000,
        secondsUntilTarget: 2700,
        additionalAp: 0,
      }),
    ).toBeNull();
  });
});
