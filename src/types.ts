import { Dayjs } from "dayjs";
import {
  red,
  orange,
  yellow,
  green,
  blue,
  purple,
  pink,
  teal,
} from "@mui/material/colors";

export interface Mushroom {
  key: string;
  label: string;
  value: number;
  minimum: number;
}

export type Estimate = "health" | "time" | "ap";
export type RadioEstimate = "health" | "startTime" | "endTime" | "ap";
export const calculationTypes: Estimate[] = ["health", "time", "ap"];

export const mushrooms: Mushroom[] = [
  { key: "sr", label: "Small Red", value: 87400, minimum: 2 },
  { key: "sy", label: "Small Yellow", value: 84200, minimum: 5 },
  { key: "sb", label: "Small Blue", value: 84200, minimum: 2 },
  { key: "spe", label: "Small Purple", value: 93900, minimum: 5 },
  { key: "sw", label: "Small White", value: 81000, minimum: 2 },
  { key: "spk", label: "Small Pink", value: 81000, minimum: 5 },
  { key: "sg", label: "Small Gray", value: 90700, minimum: 2 },
  { key: "sib", label: "Small Ice Blue", value: 81000, minimum: 5 },
  { key: "nr", label: "Normal Red", value: 670600, minimum: 2 * 10 },
  { key: "ny", label: "Normal Yellow", value: 645800, minimum: 5 * 10 },
  { key: "nb", label: "Normal Blue", value: 645800, minimum: 2 * 10 },
  { key: "npe", label: "Normal Purple", value: 720300, minimum: 5 * 10 },
  { key: "nw", label: "Normal White", value: 621000, minimum: 2 * 10 },
  { key: "npk", label: "Normal Pink", value: 621000, minimum: 5 * 10 },
  { key: "ng", label: "Normal Gray", value: 695500, minimum: 2 * 10 },
  { key: "nib", label: "Normal Ice Blue", value: 621000, minimum: 5 * 10 },
  { key: "nf", label: "Normal Fire", value: 3850200, minimum: 10 * 104 },
  { key: "nw", label: "Normal Water", value: 3816700, minimum: 10 * 103 },
  { key: "nc", label: "Normal Crystal", value: 3883600, minimum: 10 * 105 },
  { key: "ne", label: "Normal Electric", value: 3816700, minimum: 10 * 103 },
  { key: "nps", label: "Normal Poisonous", value: 3783200, minimum: 10 * 102 },
  { key: "lr", label: "Large Red", value: 2916000, minimum: 2 * 15 },
  { key: "ly", label: "Large Yellow", value: 2808000, minimum: 5 * 15 },
  { key: "lb", label: "Large Blue", value: 2808000, minimum: 2 * 15 },
  { key: "lpe", label: "Large Purple", value: 3132000, minimum: 5 * 15 },
  { key: "lw", label: "Large White", value: 2700000, minimum: 2 * 15 },
  { key: "lpk", label: "Large Pink", value: 2700000, minimum: 5 * 15 },
  { key: "lg", label: "Large Gray", value: 3024000, minimum: 2 * 15 },
  { key: "lib", label: "Large Ice Blue", value: 2700000, minimum: 5 * 15 },
  { key: "lf", label: "Large Fire", value: 13662000, minimum: 15 * 104 },
  { key: "lw", label: "Large Water", value: 13543200, minimum: 15 * 103 },
  { key: "lc", label: "Large Crystal", value: 13780800, minimum: 15 * 105 },
  { key: "le", label: "Large Electric", value: 13543200, minimum: 15 * 103 },
  { key: "lps", label: "Large Poisonous", value: 13424400, minimum: 15 * 102 },
  { key: "nm", label: "Normal Event", value: 648000, minimum: 2 * 10 },
  { key: "gm", label: "Giant Event", value: 2880000, minimum: 2 * 20 },
];

export interface ChallengeStage {
  stage: string;
  tries: number;
}

export const mushStages: ChallengeStage[] = [
  { stage: "1-4", tries: 2 },
  { stage: "2-2", tries: 2 },
  { stage: "2-3", tries: 3 },
  { stage: "2-4", tries: 4 },
  { stage: "3-2", tries: 3 },
  { stage: "3-3", tries: 4 },
  { stage: "3-4", tries: 5 },
  { stage: "4-1", tries: 3 },
  { stage: "4-2", tries: 4 },
  { stage: "4-3", tries: 4 },
  { stage: "4-4", tries: 5 },
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

export type TimeUnit = "day" | "hour" | "minute" | "second";

export interface Segment {
  px: number;
  color: string;
}

const shade = 700;

export const colorPalette: string[] = [
  blue[shade],
  orange[shade],
  green[shade],
  purple[shade],
  red[shade],
];
