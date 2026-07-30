import { Dayjs } from "dayjs";

import {
  calculateApTimeRange,
  calculateBattleDurationSeconds,
  calculateEndTime,
  calculateHealthTimeRange,
  calculateRemainingHealth,
  calculateStartTime,
  secondsToDuration,
} from "./helpers";
import { DerivedField, Mushroom, TimeRemaining } from "./types";

export interface NewMushroomFormState {
  derived: DerivedField | null;
  mush: Mushroom | null;
  health: number;
  pikminAp: number;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
}

export interface ExistingMushroomSeed {
  currentAp: number;
  healthRemaining: number;
  timeRemaining: TimeRemaining;
}

export interface SnapshotDurationCheck {
  calculatedSeconds: number;
  reportedSeconds: number;
  toleranceSeconds: number;
  isConsistent: boolean;
}

const isPositiveFinite = (value: number) =>
  Number.isFinite(value) && value > 0;

const DURATION_TOLERANCE_SECONDS = 5 * 60;

export const checkSnapshotDuration = (
  currentAp: number,
  healthRemaining: number,
  reportedSeconds: number,
): SnapshotDurationCheck | null => {
  const calculatedSeconds = calculateBattleDurationSeconds(
    healthRemaining,
    currentAp,
  );
  if (calculatedSeconds == null || !isPositiveFinite(reportedSeconds)) {
    return null;
  }

  return {
    calculatedSeconds,
    reportedSeconds,
    toleranceSeconds: DURATION_TOLERANCE_SECONDS,
    isConsistent:
      Math.abs(calculatedSeconds - reportedSeconds) <=
      DURATION_TOLERANCE_SECONDS,
  };
};

export const recomputeDerived = (
  state: NewMushroomFormState,
): NewMushroomFormState => {
  const { derived, mush, health, pikminAp, startTime, endTime } = state;

  if (!mush) return state;

  if (derived === "ap" && startTime && endTime) {
    return {
      ...state,
      pikminAp: calculateApTimeRange(health, startTime, endTime),
    };
  }
  if (derived === "health" && startTime && endTime && pikminAp > 0) {
    return {
      ...state,
      health: calculateHealthTimeRange(pikminAp, startTime, endTime),
    };
  }
  if (
    derived === "startTime" &&
    endTime &&
    isPositiveFinite(health) &&
    isPositiveFinite(pikminAp)
  ) {
    return {
      ...state,
      startTime: calculateStartTime(health, pikminAp, endTime),
    };
  }
  if (
    derived === "endTime" &&
    startTime &&
    isPositiveFinite(health) &&
    isPositiveFinite(pikminAp)
  ) {
    return {
      ...state,
      endTime: calculateEndTime(health, pikminAp, startTime),
    };
  }
  return state;
};

export const getApForSelectedMushroom = (
  currentAp: number,
  mushroom: Mushroom,
) => (currentAp === 2 ? mushroom.minimum : currentAp);

export const createExistingMushroomSeed = (
  state: NewMushroomFormState,
  snapshotTime: Dayjs,
): ExistingMushroomSeed | null => {
  const { mush, health, pikminAp, startTime } = state;
  if (
    !mush ||
    !startTime ||
    !startTime.isValid() ||
    !snapshotTime.isValid() ||
    startTime.isAfter(snapshotTime) ||
    !isPositiveFinite(health) ||
    !isPositiveFinite(pikminAp)
  ) {
    return null;
  }

  const elapsedSeconds = Math.max(0, snapshotTime.diff(startTime, "second"));
  const healthRemaining = calculateRemainingHealth(
    health,
    pikminAp,
    elapsedSeconds,
  );
  const secondsRemaining = calculateBattleDurationSeconds(
    healthRemaining,
    pikminAp,
  );
  if (secondsRemaining == null) return null;

  return {
    currentAp: pikminAp,
    healthRemaining,
    timeRemaining: secondsToDuration(secondsRemaining),
  };
};
