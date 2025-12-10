export interface Mushroom {
  label: string;
  value: number;
}

export type Estimate = "health" | "time" | "ap";

export const mushrooms: Mushroom[] = [
  { label: "Small Red", value: 87400 },
  { label: "Small Yellow", value: 84200 },
  { label: "Small Blue", value: 84200 },
  { label: "Small Purple", value: 93900 },
  { label: "Small White", value: 81000 },
  { label: "Small Pink", value: 81000 },
  { label: "Small Gray", value: 90700 },
  { label: "Small Ice Blue", value: 81000 },
  { label: "Normal Red", value: 670600 },
  { label: "Normal Yellow", value: 645800 },
  { label: "Normal Blue", value: 645800 },
  { label: "Normal Purple", value: 720300 },
  { label: "Normal White", value: 621000 },
  { label: "Normal Pink", value: 621000 },
  { label: "Normal Gray", value: 695500 },
  { label: "Normal Ice Blue", value: 621000 },
  { label: "Normal Fire", value: 3850200 },
  { label: "Normal Water", value: 3816700 },
  { label: "Normal Crystal", value: 3883600 },
  { label: "Normal Electric", value: 3816700 },
  { label: "Normal Poisonous", value: 3783200 },
  { label: "Large Red", value: 2916000 },
  { label: "Large Yellow", value: 2808000 },
  { label: "Large Blue", value: 2808000 },
  { label: "Large Purple", value: 3132000 },
  { label: "Large White", value: 2700000 },
  { label: "Large Pink", value: 2700000 },
  { label: "Large Gray", value: 3024000 },
  { label: "Large Ice Blue", value: 2700000 },
  { label: "Large Fire", value: 13662000 },
  { label: "Large Water", value: 13543200 },
  { label: "Large Crystal", value: 13780800 },
  { label: "Large Electric", value: 13543200 },
  { label: "Large Poisonous", value: 13424400 },
  { label: "Normal Event", value: 648000 },
  { label: "Giant Event", value: 2880000 },
  { label: "Super Giant Event", value: 3456000 },
];

export const higherBaseAp = ["Yellow", "Purple", "Pink", "Ice Blue"];

export const elementals = ["Fire", "Water", "Crystal", "Electric", "Poisonous"];
