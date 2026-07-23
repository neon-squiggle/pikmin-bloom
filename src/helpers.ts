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

export const durationToSeconds = ({
  days,
  hours,
  minutes,
  seconds,
}: TimeRemaining): number =>
  Number(days) * 86400 +
  Number(hours) * 3600 +
  Number(minutes) * 60 +
  Number(seconds);

export const secondsToDuration = (totalSeconds: number): TimeRemaining => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  return {
    days: Math.floor(safeSeconds / 86400),
    hours: Math.floor((safeSeconds % 86400) / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
    seconds: safeSeconds % 60,
  };
};

export const calculateRemainingHealth = (
  health: number,
  ap: number,
  elapsedSeconds: number,
): number =>
  Math.max(0, health - (ap * Math.max(0, elapsedSeconds)) / 100);

interface AdditionalApInput {
  currentAp: number;
  healthRemaining: number;
  secondsUntilTarget: number;
  secondsUntilApAdded: number;
}

export const calculateAdditionalAp = ({
  currentAp,
  healthRemaining,
  secondsUntilTarget,
  secondsUntilApAdded,
}: AdditionalApInput): number | null => {
  const boostedDuration = secondsUntilTarget - secondsUntilApAdded;

  if (
    currentAp <= 0 ||
    healthRemaining <= 0 ||
    secondsUntilTarget <= 0 ||
    secondsUntilApAdded < 0 ||
    boostedDuration <= 0
  ) {
    return null;
  }

  const remainingApSeconds =
    healthRemaining * 100 - currentAp * secondsUntilTarget;

  return Math.max(0, remainingApSeconds / boostedDuration);
};
