import dayjs, { Dayjs } from "dayjs";
import { Mushroom, MushroomData, TimeRemaining, mushrooms } from "./types";

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
  return Math.ceil((health * 100) / timeEstimate);
};

export const calculateAp = (health: number, time: Dayjs) => {
  const timeEstimate = dayjs().diff(time, "second");
  return Math.ceil((health * 100) / timeEstimate);
};

export const calculateHealth = (ap: number, time: Dayjs) => {
  const timeEstimate = dayjs().diff(time, "second");
  return Math.ceil((ap * timeEstimate) / 100);
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

export const encodeEvent = (event: MushroomData) => {
  const m = event.mush.key;
  const h = event.health.toString(36);
  const ap = event.pikminAp.toString(36);
  const st = event.startTime.unix().toString(36);
  const et = event.endTime.unix().toString(36);

  console.log(event.startTime, event.endTime);
  return `${m}-${h}-${ap}-${st}-${et}`;
};

export const decodeEvent = (code: string): MushroomData | null => {
  if (!code) return null;
  const parts = code.split("-");
  if (parts.length !== 5) return null;

  const [mKey, hStr, apStr, stStr, etStr] = code.split("-");

  const mush: Mushroom | undefined = mushrooms.find((m) => m.key === mKey);
  if (!mush) return null;

  const health = parseInt(hStr, 36);
  const pikminAp = parseInt(apStr, 36);
  const startTime = parseInt(stStr, 36);
  const endTime = parseInt(etStr, 36);

  if (
    Number.isNaN(health) ||
    Number.isNaN(pikminAp) ||
    Number.isNaN(startTime) ||
    Number.isNaN(endTime)
  ) {
    return null;
  }

  return {
    mush,
    health,
    pikminAp,
    startTime: dayjs(startTime * 1000),
    endTime: dayjs(endTime * 1000),
  };
};
