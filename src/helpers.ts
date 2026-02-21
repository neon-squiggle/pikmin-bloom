import dayjs, { Dayjs } from "dayjs";
import { TimeRemaining } from "./types";

export const calculateStartTime = (
  health: number,
  ap: number,
  endTime: Dayjs
) => {
  const timeEstimate = (health * 100) / ap;
  return endTime.subtract(timeEstimate, "second");
};

export const calculateEndTime = (
  health: number,
  ap: number,
  startTime: Dayjs
) => {
  const timeEstimate = (health * 100) / ap;
  return startTime.add(timeEstimate, "second");
};

export const calculateHealthTimeRange = (
  ap: number,
  startTime: Dayjs,
  endTime: Dayjs
) => {
  const timeEstimate = endTime.diff(startTime, "second");
  return Math.ceil((ap * timeEstimate) / 100);
};

export const calculateApTimeRange = (
  health: number,
  startTime: Dayjs,
  endTime: Dayjs
) => {
  const timeEstimate = endTime.diff(startTime, "second");
  if (timeEstimate <= 0) return 0;
  return (health * 100) / timeEstimate;
};

export const diffToTimeRemaining = (target: Dayjs): TimeRemaining => {
  const now = dayjs();

  let diffMs = target.diff(now);
  if (diffMs < 0) diffMs = 0;

  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

export const durationFromNowToEndDate = ({
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
}) =>
  dayjs()
    .add(Number(days), "day")
    .add(Number(hours), "hour")
    .add(Number(minutes), "minute")
    .add(Number(seconds), "second");

export const isInvalidDuration = ({
  days,
  hours,
  minutes,
  seconds,
}: TimeRemaining): boolean =>
  [days, hours, minutes, seconds].every((v) => Number(v) === 0);

