import dayjs from "dayjs";
import {
  getApForSelectedMushroom,
  NewMushroomFormState,
  recomputeDerived,
} from "./mushroomCalculator";
import { isPlannedMushroom, PlannerFinish } from "./stagePlanner";
import { mushrooms } from "./types";

export interface PlannerCalculationRequest {
  id: string;
  finish: PlannerFinish;
}
export const calculatorFormForFinish = (
  finish: PlannerFinish,
): NewMushroomFormState => {
  const name = finish.type.replace(/\s+mushroom$/i, "").toLowerCase();
  const mushroom =
    mushrooms.find((item) => item.label.toLowerCase() === name) ?? null;
  return recomputeDerived({
    derived: "startTime",
    mush: mushroom,
    health: finish.plannedHealth ?? mushroom?.value ?? Number.NaN,
    pikminAp:
      finish.plannedAp ??
      (mushroom ? getApForSelectedMushroom(2, mushroom) : 2),
    startTime: null,
    endTime: dayjs(finish.endAt),
  });
};
export const finishFromCalculator = (
  original: PlannerFinish,
  form: NewMushroomFormState,
): PlannerFinish | null => {
  if (
    !isPlannedMushroom(original) ||
    !form.mush ||
    !form.startTime?.isValid() ||
    !form.endTime?.isValid() ||
    !form.endTime.isAfter(form.startTime) ||
    !(form.health > 0) ||
    !(form.pikminAp > 0)
  )
    return null;
  const originalPreset = mushrooms.some(
    (item) =>
      `${item.label} Mushroom`.toLowerCase() === original.type.toLowerCase(),
  );
  return {
    ...original,
    status: "planned",
    type:
      originalPreset || !original.type
        ? `${form.mush.label} Mushroom`
        : original.type,
    startAt: form.startTime.toISOString(),
    endAt: form.endTime.toISOString(),
    plannedAp: form.pikminAp,
    plannedHealth: form.health,
    tryDay: undefined,
    capturedAt: undefined,
  };
};
