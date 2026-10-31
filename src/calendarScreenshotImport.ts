import { durationToSeconds } from "./helpers";
import { BattleScreenshotResult } from "./readBattleScreenshot";
import { PlannerFinish } from "./stagePlanner";
import { latestExistingBattle, matchExistingBattle } from "./plannerRecords";
import { validTryDate } from "./hypotheticalTries";

export interface ScreenshotDraft {
  id: string;
  filename: string;
  title: string;
  type: string;
  capturedAt: string | null;
  countdown: BattleScreenshotResult["countdown"];
  warnings: string[];
  tryDay?: string;
}

export const screenshotTryDay = (draft: ScreenshotDraft, finishes: PlannerFinish[]) =>
  draft.tryDay ?? latestExistingBattle(finishes, draft.title, draft.type)?.tryDay ?? "";

export const draftFinishTime = (draft: ScreenshotDraft) => {
  if (
    !draft.capturedAt ||
    !draft.countdown ||
    !draft.title.trim() ||
    !draft.type.trim() ||
    (draft.tryDay != null && !validTryDate(draft.tryDay))
  )
    return null;
  const capture = Date.parse(draft.capturedAt);
  const duration = durationToSeconds(draft.countdown);
  return Number.isFinite(capture) && duration > 0
    ? capture + duration * 1000
    : null;
};

export const mergeScreenshotDrafts = (
  finishes: PlannerFinish[],
  drafts: ScreenshotDraft[],
) => {
  let merged = [...finishes];
  let added = 0,
    updated = 0,
    skipped = 0;
  for (const draft of drafts) {
    const end = draftFinishTime(draft);
    if (end == null) {
      skipped++;
      continue;
    }
    const matches = matchExistingBattle(merged, draft.title, draft.type);
    const match = latestExistingBattle(merged, draft.title, draft.type);
    if (match)
      merged = merged.filter(
        (record) => record === match || !matches.includes(record),
      );
    const record: PlannerFinish = {
      ...match,
      id: match?.id ?? draft.id,
      title: draft.title.trim(),
      type: draft.type.trim(),
      endAt: new Date(end).toISOString(),
      source: "screenshot",
      status: "running",
      missed: false,
      capturedAt: draft.capturedAt!,
      filename: draft.filename,
      tryDay: screenshotTryDay(draft, merged) || undefined,
    };
    if (match) {
      merged[merged.indexOf(match)] = record;
      updated++;
    } else {
      merged.push(record);
      added++;
    }
  }
  return { finishes: merged, added, updated, skipped };
};
