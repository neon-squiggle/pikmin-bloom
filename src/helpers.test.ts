import dayjs from "dayjs";
import {
  calculateStartTime,
  calculateEndTime,
  calculateHealthTimeRange,
  calculateApTimeRange,
  diffToTimeRemaining,
  durationFromNowToEndDate,
  isInvalidDuration,
  durationToSeconds,
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

describe("durationFromNowToEndDate", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("adds duration to current time", () => {
    const result = durationFromNowToEndDate({
      days: 1,
      hours: 2,
      minutes: 30,
      seconds: 45,
    });
    const expected = dayjs().add(1, "day").add(2, "hour").add(30, "minute").add(45, "second");
    expect(result.unix()).toBe(expected.unix());
  });

  it("handles partial duration (only some fields)", () => {
    const result = durationFromNowToEndDate({ hours: 5 });
    const expected = dayjs().add(5, "hour");
    expect(result.unix()).toBe(expected.unix());
  });

  it("handles empty duration", () => {
    const result = durationFromNowToEndDate({});
    const expected = dayjs();
    expect(result.unix()).toBe(expected.unix());
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
});

describe("durationToSeconds", () => {
  it("converts all duration fields to seconds", () => {
    expect(
      durationToSeconds({ days: 1, hours: 2, minutes: 3, seconds: 4 }),
    ).toBe(93784);
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
