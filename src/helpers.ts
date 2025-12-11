import dayjs, { Dayjs } from "dayjs";
import { Estimate, Mushroom } from "./types";

export const calculateTime = (health: number, ap: number) => {
  const timeEstimate = (health * 100) / ap;
  return dayjs().add(timeEstimate, "second");
};

export const calculateAp = (health: number, time: Dayjs) => {
  const timeEstimate = dayjs(time).diff(dayjs(), "second");
  return Math.ceil((health * 100) / timeEstimate);
};

export const calculateHealth = (ap: number, time: Dayjs) => {
  const timeEstimate = dayjs(time).diff(dayjs(), "second");
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
