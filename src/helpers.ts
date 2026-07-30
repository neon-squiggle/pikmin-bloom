import dayjs, { Dayjs } from "dayjs";
import { TimeRemaining, TimeRemainingInput } from "./types";

const isPositiveFinite = (value: number) =>
  Number.isFinite(value) && value > 0;

export const calculateBattleDurationSeconds = (
  health: number,
  ap: number,
): number | null => {
  if (!isPositiveFinite(health) || !isPositiveFinite(ap)) return null;
  const duration = (health * 100) / ap;
  return Number.isFinite(duration) ? duration : null;
};

export const calculateStartTime = (
  health: number,
  ap: number,
  endTime: Dayjs,
) => {
  if (!endTime.isValid()) return endTime;
  const duration = calculateBattleDurationSeconds(health, ap);
  return duration == null ? endTime : endTime.subtract(duration, "second");
};

export const calculateEndTime = (
  health: number,
  ap: number,
  startTime: Dayjs,
) => {
  if (!startTime.isValid()) return startTime;
  const duration = calculateBattleDurationSeconds(health, ap);
  return duration == null ? startTime : startTime.add(duration, "second");
};

export const calculateHealthTimeRange = (
  ap: number,
  startTime: Dayjs,
  endTime: Dayjs,
) => {
  const elapsedSeconds = endTime.diff(startTime, "second");
  if (
    !startTime.isValid() ||
    !endTime.isValid() ||
    !isPositiveFinite(ap) ||
    !isPositiveFinite(elapsedSeconds)
  ) {
    return 0;
  }
  return Math.ceil((ap * elapsedSeconds) / 100);
};

export const calculateApTimeRange = (
  health: number,
  startTime: Dayjs,
  endTime: Dayjs,
) => {
  const elapsedSeconds = endTime.diff(startTime, "second");
  if (
    !startTime.isValid() ||
    !endTime.isValid() ||
    !isPositiveFinite(health) ||
    !isPositiveFinite(elapsedSeconds)
  ) {
    return 0;
  }
  return (health * 100) / elapsedSeconds;
};

export const diffToTimeRemaining = (target: Dayjs): TimeRemaining => {
  const now = dayjs();

  let diffMs = target.diff(now);
  if (!target.isValid() || !Number.isFinite(diffMs) || diffMs < 0) diffMs = 0;

  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

export const isInvalidDuration = ({
  days,
  hours,
  minutes,
  seconds,
}: TimeRemaining): boolean => {
  const values = [days, hours, minutes, seconds].map(Number);
  return (
    values.some((value) => !Number.isFinite(value) || value < 0) ||
    values.every((value) => value === 0)
  );
};

export const durationToSeconds = ({
  days,
  hours,
  minutes,
  seconds,
}: TimeRemaining): number => {
  const totalSeconds =
    Number(days) * 86400 +
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds);
  return Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
};

export const parseTimeRemaining = (
  input: TimeRemainingInput,
): TimeRemaining | null => {
  const { days, hours, minutes, seconds } = input;
  const values = [days, hours, minutes, seconds];
  if (
    values.some(
      (value) =>
        value == null ||
        !Number.isFinite(value) ||
        !Number.isInteger(value) ||
        value < 0,
    ) ||
    days == null ||
    hours == null ||
    minutes == null ||
    seconds == null ||
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }

  const duration = { days, hours, minutes, seconds };
  return durationToSeconds(duration) > 0 ? duration : null;
};

export const secondsToDuration = (totalSeconds: number): TimeRemaining => {
  const safeSeconds =
    Number.isFinite(totalSeconds) && totalSeconds > 0
      ? Math.floor(totalSeconds)
      : 0;

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
): number => {
  if (!isPositiveFinite(health)) return 0;
  if (!isPositiveFinite(ap) || !Number.isFinite(elapsedSeconds)) return health;
  return Math.max(0, health - (ap * Math.max(0, elapsedSeconds)) / 100);
};

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
  const values = [
    currentAp,
    healthRemaining,
    secondsUntilTarget,
    secondsUntilApAdded,
  ];

  if (
    values.some((value) => !Number.isFinite(value)) ||
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
  if (!Number.isFinite(remainingApSeconds)) return null;

  const additionalAp = remainingApSeconds / boostedDuration;
  return Number.isFinite(additionalAp) ? Math.max(0, additionalAp) : null;
};

interface ApAdditionDelayInput {
  currentAp: number;
  healthRemaining: number;
  secondsUntilTarget: number;
  additionalAp: number;
}

export const calculateApAdditionDelay = ({
  currentAp,
  healthRemaining,
  secondsUntilTarget,
  additionalAp,
}: ApAdditionDelayInput): number | null => {
  const values = [
    currentAp,
    healthRemaining,
    secondsUntilTarget,
    additionalAp,
  ];
  if (
    values.some((value) => !Number.isFinite(value)) ||
    currentAp <= 0 ||
    healthRemaining <= 0 ||
    secondsUntilTarget <= 0 ||
    additionalAp <= 0
  ) {
    return null;
  }

  const remainingApSeconds =
    healthRemaining * 100 - currentAp * secondsUntilTarget;
  if (!Number.isFinite(remainingApSeconds)) return null;

  if (remainingApSeconds <= 0) return 0;

  return Math.max(
    0,
    Math.min(
      secondsUntilTarget - 1,
      secondsUntilTarget - remainingApSeconds / additionalAp,
    ),
  );
};
