import { initialPlannerFinishes } from "./testFixtures/screenshotMushrooms";
import {
  draftFinishTime,
  mergeScreenshotDrafts,
  ScreenshotDraft,
} from "./calendarScreenshotImport";
import { mergeManualFinish } from "./plannerRecords";
import { parseMushroomTitle, parseMushroomType } from "./screenshotParsing";

const draft: ScreenshotDraft = {
  id: "import",
  filename: "screenshot.png",
  title: "Prien Lake Mall East Entrance",
  type: "Small Red Mushroom",
  capturedAt: "2026-10-30T17:56:19.000Z",
  countdown: { days: 2, hours: 0, minutes: 38, seconds: 26 },
  warnings: [],
};
it("extracts wrapped event types without a fixed color vocabulary and removes the title chevron", () => {
  expect(parseMushroomType("Giant Halloween\nMushroom")).toBe(
    "Giant Halloween Mushroom",
  );
  expect(parseMushroomType("Small Ice Blue Mushroom")).toBe(
    "Small Ice Blue Mushroom",
  );
  expect(parseMushroomTitle("Die trauernde Frau ›")).toBe("Die trauernde Frau");
});
it("updates the matching battle without duplicating it and preserves capture-based elapsed time across DST", () => {
  const result = mergeScreenshotDrafts(initialPlannerFinishes(), [draft]);
  expect(result.finishes).toHaveLength(5);
  expect(result.updated).toBe(1);
  expect(
    result.finishes.find((finish) => finish.id === "IMG_4082")?.endAt,
  ).toBe("2026-11-01T18:34:45.000Z");
  expect(draftFinishTime({ ...draft, capturedAt: null })).toBeNull();
});
it("uses the latest entry even when its screenshot capture is older", () => {
  const records = initialPlannerFinishes();
  records[0] = {
    ...records[0],
    capturedAt: "2026-10-31T18:00:00Z",
    endAt: "2026-11-01T18:00:00Z",
  };
  const result = mergeScreenshotDrafts(records, [draft]);
  expect(result.skipped).toBe(0);
  expect(result.finishes[0].capturedAt).toBe(draft.capturedAt);
});
it("updates a manually entered location and type automatically", () => {
  const manual = {
    ...initialPlannerFinishes()[0],
    source: "manual" as const,
    capturedAt: undefined,
  };
  const result = mergeScreenshotDrafts([manual], [draft]);
  expect(result.finishes).toHaveLength(1);
  expect(result.updated).toBe(1);
  expect(result.finishes[0].id).toBe(manual.id);
});
it("restores a mushroom marked as not counted when its screenshot is reuploaded without adding a duplicate", () => {
  const excluded = { ...initialPlannerFinishes()[0], missed: true };
  const result = mergeScreenshotDrafts([excluded], [draft]);
  expect(result.added).toBe(0);
  expect(result.updated).toBe(1);
  expect(result.finishes).toHaveLength(1);
  expect(result.finishes[0]).toMatchObject({
    id: excluded.id,
    missed: false,
    endAt: "2026-11-01T18:34:45.000Z",
  });
});
it("merges a batch consistently when it contains successive observations of one battle", () => {
  const result = mergeScreenshotDrafts(
    [],
    [draft, { ...draft, id: "next", capturedAt: "2026-10-30T18:00:00Z" }],
  );
  expect(result.finishes).toHaveLength(1);
  expect(result.added).toBe(1);
  expect(result.updated).toBe(1);
  expect(result.finishes[0].capturedAt).toBe("2026-10-30T18:00:00Z");
});
it("preserves planned start details when a screenshot updates the finish", () => {
  const records = [
    {
      ...initialPlannerFinishes()[0],
      startAt: "2026-10-30T12:00:00Z",
      plannedAp: 10,
    },
  ];
  const result = mergeScreenshotDrafts(records, [draft]);
  expect(result.finishes[0]).toMatchObject({
    startAt: "2026-10-30T12:00:00Z",
    plannedAp: 10,
  });
});

it("deduplicates manually added battles with normalized names and types", () => {
  const existing = {
    ...initialPlannerFinishes()[0],
    source: "manual" as const,
  };
  const updated = {
    ...existing,
    id: "new",
    title: "  prien lake mall east entrance ",
    type: "Small   Red Mushroom",
    endAt: "2026-11-05T12:00:00Z",
  };
  const result = mergeManualFinish([existing], updated);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({
    id: existing.id,
    endAt: updated.endAt,
    capturedAt: undefined,
  });
});
it("collapses matching saved duplicates when editing a battle into the same name and type", () => {
  const existing = initialPlannerFinishes()[0];
  const edited = {
    ...initialPlannerFinishes()[1],
    title: existing.title,
    type: existing.type,
  };
  const result = mergeManualFinish(
    [existing, initialPlannerFinishes()[1]],
    edited,
  );
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe(edited.id);
});
it("keeps separately planned tries distinct even with identical title, type and end", () => {
  const existing = {
    ...initialPlannerFinishes()[0],
    source: "hypothetical" as const,
  };
  expect(
    mergeManualFinish([existing], { ...existing, id: "another" }),
  ).toHaveLength(2);
  expect(
    mergeManualFinish([existing], {
      ...existing,
      endAt: "2026-11-05T12:00:00Z",
    }),
  ).toHaveLength(1);
});
it("coalesces duplicates and applies the newly entered screenshot", () => {
  const newest = {
    ...initialPlannerFinishes()[0],
    capturedAt: "2026-10-31T12:00:00Z",
  };
  const result = mergeScreenshotDrafts(
    [{ ...newest, id: "old", capturedAt: "2026-10-29T12:00:00Z" }, newest],
    [draft],
  );
  expect(result.finishes).toHaveLength(1);
  expect(result.finishes[0].capturedAt).toBe(draft.capturedAt);
  expect(result.skipped).toBe(0);
});


it("preserves an uploaded mushroom's free-try date on reupload and allows it to be set or cleared", () => {
  const dated = { ...initialPlannerFinishes()[0], tryDay: "2026-10-29", usesFreeTry: false };
  expect(mergeScreenshotDrafts([dated], [draft]).finishes[0]).toMatchObject({ tryDay: "2026-10-29", usesFreeTry: false });
  const result = mergeScreenshotDrafts([dated], [{ ...draft, tryDay: "2026-10-30" }]);
  expect(result.finishes).toHaveLength(1);
  expect(result.finishes[0].tryDay).toBe("2026-10-30");
  expect(mergeScreenshotDrafts(result.finishes, [{ ...draft, tryDay: "" }]).finishes[0].tryDay).toBeUndefined();
});
