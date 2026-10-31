import dayjs from "dayjs";

import {
  addElapsedTime,
  calculateApTimeRange,
  calculateEndTime,
  calculateHealthTimeRange,
  calculateStartTime,
} from "./helpers";

// Run this suite with different TZ environments to exercise native local dates
// across hour changes, half-hour changes, and regions without daylight saving.
describe.each([
  [
    "America/Los_Angeles",
    "2026-03-07T12:00:00-08:00",
    "2026-03-08T20:00:00.000Z",
    "13:00",
  ],
  [
    "America/Los_Angeles",
    "2026-10-31T12:00:00-07:00",
    "2026-11-01T19:00:00.000Z",
    "11:00",
  ],
  [
    "Europe/Berlin",
    "2026-03-28T12:00:00+01:00",
    "2026-03-29T11:00:00.000Z",
    "13:00",
  ],
  [
    "Europe/Berlin",
    "2026-10-24T12:00:00+02:00",
    "2026-10-25T10:00:00.000Z",
    "11:00",
  ],
  [
    "Australia/Lord_Howe",
    "2026-04-04T12:00:00+11:00",
    "2026-04-05T01:00:00.000Z",
    "11:30",
  ],
  [
    "Australia/Lord_Howe",
    "2026-10-03T12:00:00+10:30",
    "2026-10-04T01:30:00.000Z",
    "12:30",
  ],
  [
    "Asia/Kolkata",
    "2026-10-31T12:00:00+05:30",
    "2026-11-01T06:30:00.000Z",
    "12:00",
  ],
])(
  "elapsed time in %s from %s",
  (timezone, capturedAt, expectedEnd, localClock) => {
    it("treats one remaining day as 24 hours and round-trips negative edits", () => {
      const start = dayjs(capturedAt);
      const end = addElapsedTime(start, 1, "day");
      expect(end.toISOString()).toBe(expectedEnd);
      expect(addElapsedTime(end, -1, "day").valueOf()).toBe(start.valueOf());
      expect(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(end.toDate()),
      ).toBe(localClock);
    });

    it("keeps the calculator's finish, start, health, and AP consistent", () => {
      const start = dayjs(capturedAt);
      const end = calculateEndTime(86400, 100, start);
      expect(end.toISOString()).toBe(expectedEnd);
      expect(calculateStartTime(86400, 100, end).valueOf()).toBe(
        start.valueOf(),
      );
      expect(calculateHealthTimeRange(100, start, end)).toBe(86400);
      expect(calculateApTimeRange(86400, start, end)).toBe(100);
    });
  },
);
