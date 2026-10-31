import {
  isPlannedMushroom,
  localDateTime,
  PlannerFinish,
} from "./stagePlanner";

// Default only new drafts; deliberately allow users to edit historical ends.
export const defaultPlannedEnd = (
  now: number,
  timezone: string,
  eventMonth: string,
) => {
  const rounded = localDateTime(
    Math.ceil((now + 3600000) / 1800000) * 1800000,
    timezone,
  );
  return rounded.slice(0, 7) < eventMonth
    ? `${eventMonth}-01T12:00:00`
    : rounded;
};

export const projectionMonth = (
  now: number,
  timezone: string,
  finishes: PlannerFinish[] = [],
) => {
  const month = localDateTime(now, timezone).slice(0, 7);
  if (finishes.length) {
    const first = finishes
      .map((finish) =>
        localDateTime(Date.parse(finish.endAt), timezone).slice(0, 7),
      )
      .sort()[0];
    return first < month ? month : first;
  }
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 7);
};
export const validTryDate = (value: string) =>
  !value ||
  (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value);

export const tryStartDay = (finish: PlannerFinish, timezone: string) => {
  if (isPlannedMushroom(finish) && finish.startAt && Number.isFinite(Date.parse(finish.startAt)))
    return localDateTime(Date.parse(finish.startAt), timezone).slice(0, 10);
  if (finish.tryDay && validTryDate(finish.tryDay)) return finish.tryDay;
  return null;
};
export const hypotheticalCount = (
  day: string,
  finishes: PlannerFinish[],
  timezone: string,
) =>
  finishes.filter(
    (finish) =>
      finish.usesFreeTry !== false && tryStartDay(finish, timezone) === day,
  ).length;
export const hypotheticalDays = (
  finishes: PlannerFinish[],
  timezone: string,
  now: number,
  eventMonth = projectionMonth(now, timezone, finishes),
  extraDays = 0,
) => {
  const actual = finishes.filter((finish) => !isPlannedMushroom(finish));
  const latest = actual.length
    ? Math.max(now, ...actual.map((finish) => Date.parse(finish.endAt)))
    : now + 6 * 86400000;
  const today = localDateTime(now, timezone).slice(0, 10);
  const month = eventMonth;
  const afterMonth = new Date(`${month}-01T12:00:00Z`);
  afterMonth.setUTCMonth(afterMonth.getUTCMonth() + 1);
  const lastDay = new Date(afterMonth.valueOf() - 86400000)
    .toISOString()
    .slice(0, 10);
  const end = [
    lastDay,
    new Date(
      Date.parse(`${localDateTime(latest, timezone).slice(0, 10)}T12:00:00Z`) +
        extraDays * 86400000,
    )
      .toISOString()
      .slice(0, 10),
  ].sort()[0];
  const days: string[] = [];
  for (let day = today; day <= end; ) {
    days.push(day);
    day = new Date(Date.parse(`${day}T12:00:00Z`) + 86400000)
      .toISOString()
      .slice(0, 10);
  }
  return days;
};
