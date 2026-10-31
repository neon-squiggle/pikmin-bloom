import dayjs from "dayjs";

import { durationToSeconds } from "../helpers";
import { TimeRemaining } from "../types";

export interface ScreenshotMushroom {
  id: string;
  title: string;
  size: "Small" | "Normal" | "Large" | "Giant";
  type: string;
  capturedAt: string;
  countdown: TimeRemaining;
}

// Transcribed from the five original screenshots. Their embedded capture times
// lack offsets; America/Los_Angeles was assumed for this sample batch. Preserve
// those instants when displaying the examples in another browser timezone.
export const screenshotMushrooms: ScreenshotMushroom[] = [
  {
    id: "IMG_4082",
    title: "Prien Lake Mall East Entrance",
    size: "Small",
    type: "Red",
    capturedAt: "2026-10-30T10:56:19-07:00",
    countdown: { days: 2, hours: 0, minutes: 38, seconds: 26 },
  },
  {
    id: "IMG_4083",
    title: "Harbour Town Park Nth Entrance.",
    size: "Giant",
    type: "Halloween",
    capturedAt: "2026-10-30T10:56:27-07:00",
    countdown: { days: 2, hours: 8, minutes: 8, seconds: 16 },
  },
  {
    id: "IMG_4084",
    title: "Pilgrim Baptist Church",
    size: "Small",
    type: "Gray",
    capturedAt: "2026-10-30T10:56:43-07:00",
    countdown: { days: 4, hours: 17, minutes: 1, seconds: 38 },
  },
  {
    id: "IMG_4085",
    title: "Die trauernde Frau",
    size: "Small",
    type: "White",
    capturedAt: "2026-10-30T10:56:50-07:00",
    countdown: { days: 4, hours: 16, minutes: 38, seconds: 17 },
  },
  {
    id: "IMG_4086",
    title: "Circle Bench",
    size: "Small",
    type: "Blue",
    capturedAt: "2026-10-30T10:56:57-07:00",
    countdown: { days: 6, hours: 20, minutes: 11, seconds: 48 },
  },
];

export const getScreenshotEndTime = (mushroom: ScreenshotMushroom) =>
  dayjs(mushroom.capturedAt).add(
    durationToSeconds(mushroom.countdown),
    "second",
  );

export const sortByScreenshotEndTime = (mushrooms: ScreenshotMushroom[]) =>
  [...mushrooms].sort(
    (a, b) =>
      getScreenshotEndTime(a).valueOf() - getScreenshotEndTime(b).valueOf(),
  );

export const initialPlannerFinishes =
  (): import("../stagePlanner").PlannerFinish[] =>
    screenshotMushrooms.map((mushroom) => ({
      id: mushroom.id,
      title: mushroom.title,
      type: `${mushroom.size} ${mushroom.type} Mushroom`,
      endAt: getScreenshotEndTime(mushroom).toISOString(),
      source: "screenshot",
      capturedAt: mushroom.capturedAt,
      filename: `${mushroom.id}.PNG`,
    }));
