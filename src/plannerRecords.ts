import { PlannerFinish } from "./stagePlanner";

export const mushroomIdentity = (title: string, type: string) =>
  `${title.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase()}|${type.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase()}`;

export const matchExistingBattle = (
  finishes: PlannerFinish[],
  title: string,
  type: string,
) =>
  finishes.filter(
    (finish) =>
      finish.source !== "hypothetical" &&
      mushroomIdentity(finish.title, finish.type) ===
        mushroomIdentity(title, type),
  );

export const latestExistingBattle = (
  finishes: PlannerFinish[], title: string, type: string,
) => matchExistingBattle(finishes, title, type).sort(
  (a, b) => Date.parse(b.capturedAt ?? b.endAt) - Date.parse(a.capturedAt ?? a.endAt),
)[0];

// Shared IDs identify an exported record, even after its title/type changes.
// Running observations also share identity by title/type; planned tries don't.
const mergeFinish = (
  finishes: PlannerFinish[],
  finish: PlannerFinish,
): PlannerFinish[] => {
  const matches =
    finish.source === "hypothetical"
      ? []
      : matchExistingBattle(finishes, finish.title, finish.type);
  const existing =
    finishes.find((record) => record.id === finish.id) ?? matches[0];
  if (!existing) return [...finishes, finish];
  const record = { ...finish, id: existing.id };
  return finishes
    .filter((item) => item.id === existing.id || !matches.includes(item))
    .map((item) => (item.id === existing.id ? record : item));
};

// Explicit manual corrections no longer describe the original screenshot.
export const mergeManualFinish = (
  finishes: PlannerFinish[],
  finish: PlannerFinish,
): PlannerFinish[] =>
  mergeFinish(finishes, { ...finish, capturedAt: undefined });

// Import is another explicit update: incoming values win, without discarding
// unrelated local records or losing imported capture/start/ticket metadata.
export const mergeImportedFinishes = (
  finishes: PlannerFinish[],
  imported: PlannerFinish[],
): PlannerFinish[] => imported.reduce(mergeFinish, [...finishes]);
