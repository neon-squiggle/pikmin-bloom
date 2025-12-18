import dayjs, { Dayjs } from "dayjs";
import { Estimate, Mushroom } from "./types";

export const calculateTime = (health: number, ap: number) => {
  const timeEstimate = (health * 100) / ap;
  return dayjs().add(timeEstimate, "second");
};

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

export const calculateAp = (
  health: number,
  endTime: Dayjs,
  startTime: Dayjs = dayjs()
) => {
  const timeEstimate = dayjs(endTime).diff(startTime, "second");
  return Math.ceil((health * 100) / timeEstimate);
};

export const calculateHealth = (
  ap: number,
  endTime: Dayjs,
  startTime: Dayjs = dayjs()
) => {
  const timeEstimate = dayjs(endTime).diff(startTime, "second");
  return Math.ceil((ap * timeEstimate) / 100);
};

export const message = (mode: Estimate | null, mush: Mushroom | null) => {
  const changeable = ["ap", "time", "health"].filter((val) => val !== mode);
  if (!mode && !mush)
    return "Of mushroom health, total AP, and end time, set any two to calculate the third.";
  if (!mode)
    return (
      "You'll need to pick one variable to hold constant, and then change " +
      "one of the others. Then I can calculate the third for you."
    );
  return `${mode} is held constant; set ${changeable[0]} to calculate ${changeable[1]}, or vice versa`;
};
