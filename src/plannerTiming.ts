import {
  EventProgress,
  finishTimeCandidates,
  localDateTime,
  PlannerState,
  ProjectedStep,
} from "./stagePlanner";

export interface FinishTiming {
  step: string;
  sleepRisk: boolean;
  gapMinutes?: number;
  shortGap: boolean;
}
export const isDuringSleep = (
  instant: number,
  timezone: string,
  start: string,
  end: string,
) => {
  if (!start || !end || start === end) return false;
  const time = localDateTime(instant, timezone).slice(11, 16);
  return start < end
    ? time >= start && time < end
    : time >= start || time < end;
};
const shiftDay = (day: string, days: number) =>
  new Date(Date.parse(`${day}T12:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
const sleepBoundary = (
  day: string,
  clock: string,
  zone: string,
  last = false,
) => {
  for (let minute = 0; minute <= 180; minute++) {
    const wall = new Date(Date.parse(`${day}T${clock}:00Z`) + minute * 60000)
      .toISOString()
      .slice(0, 19);
    const candidates = finishTimeCandidates(wall, zone);
    if (candidates.length) return candidates[last ? candidates.length - 1 : 0];
  }
  return null;
};
export const awakeMinutesBetween = (
  from: number,
  until: number,
  zone: string,
  start: string,
  end: string,
) => {
  let awake = until - from;
  if (!start || !end || start === end) return Math.max(0, awake / 60000);
  const finalDay = localDateTime(until, zone).slice(0, 10);
  for (
    let day = shiftDay(localDateTime(from, zone).slice(0, 10), -1);
    day <= finalDay;
    day = shiftDay(day, 1)
  ) {
    const begins = sleepBoundary(day, start, zone);
    const ends = sleepBoundary(
      start > end ? shiftDay(day, 1) : day,
      end,
      zone,
      true,
    );
    if (begins != null && ends != null)
      awake -= Math.max(0, Math.min(until, ends) - Math.max(from, begins));
  }
  return Math.max(0, awake / 60000);
};
export const finishTimings = (
  rows: ProjectedStep[],
  settings: Pick<
    PlannerState,
    "timezone" | "sleepStart" | "sleepEnd" | "minimumGapMinutes"
  >,
  context: { month: string; progress?: EventProgress },
) => {
  const result = new Map<string, FinishTiming>();
  const startsAt = context.progress
    ? Date.parse(context.progress.asOf)
    : (sleepBoundary(`${context.month}-01`, "00:00", settings.timezone) ??
      undefined);
  // Opening non-mushroom tasks cannot be completed before the event starts.
  // A saved, partially filled mushroom task is already unlocked, however.
  let previousTaskEnd = rows[0]?.mushrooms === 0 ? startsAt : undefined;
  for (const row of rows) {
    // Claiming a task unlocks the next one. Every mushroom in that next task
    // must be checked against the same completion, even after a risky finish.
    for (const finish of row.finishes) {
      const end = Date.parse(finish.endAt);
      const gapMinutes =
        previousTaskEnd != null ? (end - previousTaskEnd) / 60000 : undefined;
      const awake =
        previousTaskEnd != null
          ? awakeMinutesBetween(
              previousTaskEnd,
              end,
              settings.timezone,
              settings.sleepStart,
              settings.sleepEnd,
            )
          : undefined;
      // Sleep and the elapsed minimum gap are independent checks. Waking up
      // before an ending allows a claim, even if fewer than minimumGapMinutes
      // of the intervening minutes were awake.
      const sleepRisk =
        awake === 0 &&
        gapMinutes != null &&
        (gapMinutes > 0 ||
          isDuringSleep(
            end,
            settings.timezone,
            settings.sleepStart,
            settings.sleepEnd,
          ));
      result.set(finish.id, {
        step: row.id,
        sleepRisk,
        gapMinutes,
        shortGap:
          gapMinutes != null &&
          (gapMinutes === 0 || gapMinutes < settings.minimumGapMinutes),
      });
    }
    if (row.finishes.length)
      previousTaskEnd = Date.parse(row.finishes[row.finishes.length - 1].endAt);
    // A fully credited quota still needs claiming even without saved endings.
    else if (row.mushrooms > 0 && row.creditedCount >= row.mushrooms)
      previousTaskEnd = startsAt;
  }
  return result;
};
export const nextLocalMidnight = (now: number, timezone: string) => {
  const day = localDateTime(now, timezone).slice(0, 10);
  const tomorrow = new Date(Date.parse(`${day}T12:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10);
  // A few regions skip midnight; resolve the first available wall clock that day.
  for (let minute = 0; minute < 180; minute++) {
    const clock = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    const candidates = finishTimeCandidates(`${tomorrow}T${clock}`, timezone);
    if (candidates.length) return candidates[0];
  }
  return now + 3600000;
};
