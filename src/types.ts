import { Dayjs } from "dayjs";

export interface Mushroom {
  key: string;
  label: string;
  value: number;
}

export type Estimate = "health" | "time" | "ap";
export type RadioEstimate = "health" | "startTime" | "endTime" | "ap";
export const calculationTypes: Estimate[] = ["health", "time", "ap"];

export const mushrooms: Mushroom[] = [
  { key: "sr", label: "Small Red", value: 87400 },
  { key: "sy", label: "Small Yellow", value: 84200 },
  { key: "sb", label: "Small Blue", value: 84200 },
  { key: "spe", label: "Small Purple", value: 93900 },
  { key: "sw", label: "Small White", value: 81000 },
  { key: "spk", label: "Small Pink", value: 81000 },
  { key: "sg", label: "Small Gray", value: 90700 },
  { key: "sib", label: "Small Ice Blue", value: 81000 },
  { key: "nr", label: "Normal Red", value: 670600 },
  { key: "ny", label: "Normal Yellow", value: 645800 },
  { key: "nb", label: "Normal Blue", value: 645800 },
  { key: "npe", label: "Normal Purple", value: 720300 },
  { key: "nw", label: "Normal White", value: 621000 },
  { key: "npk", label: "Normal Pink", value: 621000 },
  { key: "ng", label: "Normal Gray", value: 695500 },
  { key: "nib", label: "Normal Ice Blue", value: 621000 },
  { key: "nf", label: "Normal Fire", value: 3850200 },
  { key: "nw", label: "Normal Water", value: 3816700 },
  { key: "nc", label: "Normal Crystal", value: 3883600 },
  { key: "ne", label: "Normal Electric", value: 3816700 },
  { key: "nps", label: "Normal Poisonous", value: 3783200 },
  { key: "lr", label: "Large Red", value: 2916000 },
  { key: "ly", label: "Large Yellow", value: 2808000 },
  { key: "lb", label: "Large Blue", value: 2808000 },
  { key: "lpe", label: "Large Purple", value: 3132000 },
  { key: "lw", label: "Large White", value: 2700000 },
  { key: "lpk", label: "Large Pink", value: 2700000 },
  { key: "lg", label: "Large Gray", value: 3024000 },
  { key: "lib", label: "Large Ice Blue", value: 2700000 },
  { key: "lf", label: "Large Fire", value: 13662000 },
  { key: "lw", label: "Large Water", value: 13543200 },
  { key: "lc", label: "Large Crystal", value: 13780800 },
  { key: "le", label: "Large Electric", value: 13543200 },
  { key: "lps", label: "Large Poisonous", value: 13424400 },
  { key: "nm", label: "Normal Event", value: 648000 },
  { key: "gm", label: "Giant Event", value: 2880000 },
];

export const higherBaseAp = ["Yellow", "Purple", "Pink", "Ice Blue"];

export const elementals = ["Fire", "Water", "Crystal", "Electric", "Poisonous"];

export type Mode = "calculator" | "calendar";

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface MushroomTry {
  id?: string;
  name?: string;
  mush: Mushroom;
  health: number;
  pikminAp: number;
  startTime?: Dayjs;
  endTime: Dayjs;
}

export interface MushroomData {
  mush: Mushroom;
  health: number;
  pikminAp: number;
  startTime: Dayjs;
  endTime: Dayjs;
}
