import { Dayjs } from "dayjs";

import {
  calculateApTimeRange,
  calculateEndTime,
  calculateHealthTimeRange,
  calculateStartTime,
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

const isPositiveFinite = (value: number) => Number.isFinite(value) && value > 0;

export const recomputeDerived = (
  state: NewMushroomFormState,
): NewMushroomFormState => {
  const { derived, mush, health, pikminAp, startTime, endTime } = state;

  const cleared =
    derived === "ap"
      ? { ...state, pikminAp: Number.NaN }
      : derived === "health"
        ? { ...state, health: Number.NaN }
        : derived === "startTime"
          ? { ...state, startTime: null }
          : derived === "endTime"
            ? { ...state, endTime: null }
            : state;
  if (!mush) return cleared;

  if (
    derived === "ap" &&
    startTime?.isValid() &&
    endTime?.isValid() &&
    isPositiveFinite(health)
  ) {
    return {
      ...state,
      pikminAp: calculateApTimeRange(health, startTime, endTime),
    };
  }
  if (
    derived === "health" &&
    startTime?.isValid() &&
    endTime?.isValid() &&
    isPositiveFinite(pikminAp)
  ) {
    return {
      ...state,
      health: calculateHealthTimeRange(pikminAp, startTime, endTime),
    };
  }
  if (
    derived === "startTime" &&
    endTime?.isValid() &&
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
    startTime?.isValid() &&
    isPositiveFinite(health) &&
    isPositiveFinite(pikminAp)
  ) {
    return {
      ...state,
      endTime: calculateEndTime(health, pikminAp, startTime),
    };
  }
  return cleared;
};

export const getApForSelectedMushroom = (
  currentAp: number,
  mushroom: Mushroom,
) => (currentAp === 2 ? mushroom.minimum : currentAp);
