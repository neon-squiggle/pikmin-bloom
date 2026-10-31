export interface PlannerFinish {
  id: string;
  title: string;
  type: string;
  endAt: string;
  source: "screenshot" | "manual" | "hypothetical";
  status?: "planned" | "running";
  tryDay?: string;
  startAt?: string;
  plannedAp?: number;
  plannedHealth?: number;
  capturedAt?: string;
  filename?: string;
  missed?: boolean;
  usesFreeTry?: boolean;
}

// Screenshot observations describe running battles; hypothetical entries are
// plans. New manual entries describe running battles; retain legacy planned entries.
export const isPlannedMushroom = (finish: PlannerFinish) =>
  finish.source !== "screenshot" &&
  (finish.source === "hypothetical" || finish.status === "planned");

export interface StageStep {
  id: string;
  stage: number;
  mushrooms: number;
  tasks: string[];
}

export const stageSteps: StageStep[] = [
  { id: "1-1", stage: 1, mushrooms: 0, tasks: ["Walk 1,000 steps"] },
  { id: "1-2", stage: 1, mushrooms: 0, tasks: ["Grow 2 Pikmin"] },
  { id: "1-3", stage: 1, mushrooms: 0, tasks: ["Complete 2 expeditions"] },
  { id: "1-4", stage: 1, mushrooms: 2, tasks: ["Plant 1,000 flowers"] },
  { id: "2-1", stage: 2, mushrooms: 0, tasks: ["Walk 2,000 steps"] },
  { id: "2-2", stage: 2, mushrooms: 2, tasks: ["Plant 1,000 flowers"] },
  { id: "2-3", stage: 2, mushrooms: 3, tasks: ["Grow 3 Pikmin"] },
  { id: "2-4", stage: 2, mushrooms: 4, tasks: ["Plant 500 primary"] },
  {
    id: "3-1",
    stage: 3,
    mushrooms: 0,
    tasks: ["Walk 2,000 steps", "Complete 2 expeditions"],
  },
  { id: "3-2", stage: 3, mushrooms: 3, tasks: ["Plant 1,500 secondary"] },
  { id: "3-3", stage: 3, mushrooms: 4, tasks: ["Plant 1,500 secondary"] },
  {
    id: "3-4",
    stage: 3,
    mushrooms: 5,
    tasks: ["Plant 1,500 secondary", "Plant 2,000 most common primary"],
  },
  { id: "4-1", stage: 4, mushrooms: 3, tasks: ["Complete 3 expeditions"] },
  { id: "4-2", stage: 4, mushrooms: 4, tasks: ["Plant 2,000 primary"] },
  {
    id: "4-3",
    stage: 4,
    mushrooms: 4,
    tasks: ["Plant 2,000 primary", "Plant 1,000 secondary"],
  },
  {
    id: "4-4",
    stage: 4,
    mushrooms: 5,
    tasks: ["Plant 2,000 primary", "Plant 2,500 secondary"],
  },
];

export interface ProjectedStep extends StageStep {
  creditedCount: number;
  finishes: PlannerFinish[];
  pastCount: number;
  presumedComplete: boolean;
}

export interface EventProgress {
  stage: number;
  step: number;
  counted: number;
  asOf: string;
}
export const eventStep = (stage: number, step: number) =>
  stageSteps[((stage - 1) % 4) * 4 + step - 1];

export const projectStages = (
  finishes: PlannerFinish[],
  now: number,
  progress?: EventProgress,
) => {
  const ordered = finishes
    .filter(
      (finish) =>
        !finish.missed &&
        (!progress || Date.parse(finish.endAt) > Date.parse(progress.asOf)),
    )
    .sort(
      (a, b) =>
        Date.parse(a.endAt) - Date.parse(b.endAt) || a.id.localeCompare(b.id),
    );
  const firstStage = progress?.stage ?? 1;
  const firstStep = progress?.step ?? 1;
  let stages = Math.max(4, firstStage);
  let slots = 0;
  for (let stage = firstStage; stage <= stages; stage++)
    for (let step = stage === firstStage ? firstStep : 1; step <= 4; step++)
      slots += eventStep(stage, step).mushrooms;
  slots -= progress?.counted ?? 0;
  while (slots < ordered.length) {
    stages++;
    const templateStage = ((stages - 1) % 4) + 1;
    slots += stageSteps
      .filter((step) => step.stage === templateStage)
      .reduce((sum, step) => sum + step.mushrooms, 0);
  }
  const rows: ProjectedStep[] = Array.from(
    { length: stages - firstStage + 1 },
    (_, index) =>
      stageSteps
        .filter(
          (step) =>
            step.stage === ((index + firstStage - 1) % 4) + 1 &&
            (index > 0 || Number(step.id.split("-")[1]) >= firstStep),
        )
        .map((step) => ({
          ...step,
          stage: index + firstStage,
          id: `${index + firstStage}-${step.id.split("-")[1]}`,
          creditedCount:
            index === 0 && Number(step.id.split("-")[1]) === firstStep
              ? (progress?.counted ?? 0)
              : 0,
          finishes: [],
          pastCount: 0,
          presumedComplete: false,
        })),
  ).flat();
  const mushroomRows = rows.filter((row) => row.mushrooms > 0);
  let current = 0;
  for (const finish of ordered) {
    while (
      mushroomRows[current].finishes.length +
        mushroomRows[current].creditedCount >=
      mushroomRows[current].mushrooms
    )
      current++;
    mushroomRows[current].finishes.push(finish);
  }
  for (const row of mushroomRows) {
    row.pastCount =
      row.creditedCount +
      row.finishes.filter((finish) => Date.parse(finish.endAt) <= now).length;
    row.presumedComplete = row.pastCount >= row.mushrooms;
  }
  // A later counted finish is evidence that the preceding non-mushroom steps
  // were reached; a projected future finish alone is not evidence of completion.
  let laterPastFinish = false;
  for (const row of [...rows].reverse()) {
    if (row.mushrooms) laterPastFinish ||= row.pastCount > 0;
    else row.presumedComplete = laterPastFinish;
  }
  return { rows };
};

export const isTimezone = (zone: string) => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const clockFormatters = new Map<string, Intl.DateTimeFormat>();
export const localDateTime = (instant: number, timezone: string) => {
  if (!clockFormatters.has(timezone))
    clockFormatters.set(
      timezone,
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }),
    );
  const parts = clockFormatters.get(timezone)!.formatToParts(new Date(instant));
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}`;
};

// Resolve a wall clock in an IANA zone. Gaps produce no candidates; repeated
// clocks produce both, so the UI can ask which occurrence the user means.
export const finishTimeCandidates = (
  wallTime: string,
  timezone: string,
): number[] => {
  // Native datetime-local fields may serialize whole seconds with .000.
  wallTime = wallTime.replace(/\.0+$/, "");
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(wallTime) ||
    !isTimezone(timezone)
  )
    return [];
  const normalized = wallTime.length === 16 ? `${wallTime}:00` : wallTime;
  const target = Date.parse(`${normalized}Z`);
  if (
    !Number.isFinite(target) ||
    new Date(target).toISOString().slice(0, 19) !== normalized
  )
    return [];
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = target + hours * 3600000;
    offsets.add(Date.parse(`${localDateTime(sample, timezone)}Z`) - sample);
  }
  return Array.from(offsets)
    .map((offset) => target - offset)
    .filter((candidate) => localDateTime(candidate, timezone) === normalized)
    .sort((a, b) => a - b);
};

export const selectedFinishTime = (
  wallTime: string,
  timezone: string,
  occurrence: string,
) => {
  const candidates = finishTimeCandidates(wallTime, timezone);
  if (candidates.length === 1) return candidates[0];
  return occurrence && candidates.includes(Number(occurrence))
    ? Number(occurrence)
    : null;
};

export interface PlannerState {
  eventProgress: Record<string, EventProgress>;
  finishes: PlannerFinish[];
  timezone: string;
  hideOtherSteps: boolean;
  selectedMonth?: string;
  sleepStart: string;
  sleepEnd: string;
  minimumGapMinutes: number;
  version: 3;
}

export const PLANNER_STORAGE_KEY = "pikmin-bloom:stage-planner:v1";
export const emptyPlanner = (timezone: string): PlannerState => ({
  finishes: [],
  timezone,
  eventProgress: {},
  hideOtherSteps: false,
  sleepStart: "",
  sleepEnd: "",
  minimumGapMinutes: 0,
  version: 3,
});
export const validMonth = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const validClock = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const parsePlannerState = (
  saved: unknown,
  browserZone: string,
): PlannerState | null => {
  if (!saved || typeof saved !== "object") return null;
  const input = saved as Partial<PlannerState>;
  if (!Array.isArray(input.finishes)) return null;
  const ids = new Set<string>();
  const valid = input.finishes.every((record: Partial<PlannerFinish>) => {
    if (
      !record ||
      typeof record.id !== "string" ||
      ids.has(record.id) ||
      typeof record.title !== "string" ||
      !record.title.trim() ||
      typeof record.type !== "string" ||
      typeof record.endAt !== "string" ||
      !Number.isFinite(Date.parse(record.endAt)) ||
      !["screenshot", "manual", "hypothetical"].includes(record.source ?? "") ||
      (record.status != null &&
        !["planned", "running"].includes(record.status)) ||
      (record.tryDay != null &&
        (typeof record.tryDay !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(record.tryDay) ||
          !Number.isFinite(Date.parse(record.tryDay)) ||
          new Date(record.tryDay).toISOString().slice(0, 10) !==
            record.tryDay)) ||
      [record.startAt, record.capturedAt].some(
        (value) =>
          value != null &&
          (typeof value !== "string" || !Number.isFinite(Date.parse(value))),
      ) ||
      [record.plannedAp, record.plannedHealth].some(
        (value) =>
          value != null &&
          (typeof value !== "number" || !Number.isFinite(value) || value < 0),
      ) ||
      (record.filename != null && typeof record.filename !== "string") ||
      (record.missed != null && typeof record.missed !== "boolean") ||
      (record.usesFreeTry != null && typeof record.usesFreeTry !== "boolean")
    )
      return false;
    ids.add(record.id);
    return true;
  });
  if (!valid) return null;
  const eventProgress: Record<string, EventProgress> = {};
  if (input.eventProgress && typeof input.eventProgress === "object")
    for (const [month, value] of Object.entries(input.eventProgress)) {
      if (
        validMonth(month) &&
        value &&
        Number.isInteger(value.stage) &&
        value.stage >= 1 &&
        value.stage <= 999 &&
        Number.isInteger(value.step) &&
        value.step >= 1 &&
        value.step <= 4 &&
        Number.isInteger(value.counted) &&
        value.counted >= 0 &&
        value.counted <= eventStep(value.stage, value.step).mushrooms &&
        typeof value.asOf === "string" &&
        Number.isFinite(Date.parse(value.asOf))
      )
        eventProgress[month] = value;
    }
  return {
    ...emptyPlanner(browserZone),
    finishes: input.finishes,
    eventProgress,
    timezone:
      typeof input.timezone === "string" && isTimezone(input.timezone)
        ? input.timezone
        : browserZone,
    hideOtherSteps: input.hideOtherSteps === true,
    selectedMonth: validMonth(input.selectedMonth)
      ? input.selectedMonth
      : undefined,
    sleepStart: validClock(input.sleepStart) ? input.sleepStart : "",
    sleepEnd: validClock(input.sleepEnd) ? input.sleepEnd : "",
    minimumGapMinutes:
      typeof input.minimumGapMinutes === "number" &&
      Number.isFinite(input.minimumGapMinutes) &&
      input.minimumGapMinutes >= 0
        ? input.minimumGapMinutes
        : 0,
  };
};

// One-time removal of records that exactly match the previous app's test seeds.
// Fingerprints include identity, finish, original capture and filename; edits survive.
const oldSeedFingerprints = new Set([
  4205977236, 2431282955, 2801531066, 3336655793, 543302041,
]);
const isUntouchedSeed = (record: PlannerFinish) => {
  if (
    !/^IMG_408[2-6]$/.test(record.id) ||
    record.source !== "screenshot" ||
    record.missed ||
    record.startAt ||
    record.tryDay ||
    record.usesFreeTry != null
  )
    return false;
  const text = JSON.stringify([
    record.id,
    record.title,
    record.type,
    record.endAt,
    record.capturedAt,
    record.filename,
  ]);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++)
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619) >>> 0;
  return oldSeedFingerprints.has(hash);
};

export const loadPlanner = (browserZone: string): PlannerState => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(PLANNER_STORAGE_KEY) ?? "null",
    );
    const state =
      parsePlannerState(stored, browserZone) ?? emptyPlanner(browserZone);
    if (stored?.version !== 3)
      state.finishes = state.finishes.filter(
        (record) => !isUntouchedSeed(record),
      );
    return state;
  } catch {
    return emptyPlanner(browserZone);
  }
};
