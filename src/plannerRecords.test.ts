import { mergeImportedFinishes } from "./plannerRecords";
import { PlannerFinish } from "./stagePlanner";

const battle: PlannerFinish = {
  id: "local",
  title: "Central Park",
  type: "Small Red Mushroom",
  endAt: "2026-11-02T12:00:00Z",
  source: "manual",
};
const planned: PlannerFinish = {
  id: "planned",
  title: "Daily mushroom",
  type: "",
  endAt: "2026-11-03T12:00:00Z",
  source: "hypothetical",
  status: "planned",
  tryDay: "2026-10-31",
};

it("combines unrelated mushrooms and uses the imported observation for the same name/type", () => {
  const incoming = {
    ...battle,
    id: "other-device",
    title: "  central  park  ",
    type: "small red mushroom",
    source: "screenshot" as const,
    endAt: "2026-11-01T12:00:00Z",
    capturedAt: "2026-10-29T12:00:00Z",
    filename: "battle.png",
  };
  const unrelated = { ...battle, id: "unrelated", title: "Museum" };
  const result = mergeImportedFinishes(
    [battle, unrelated],
    [incoming, planned],
  );
  expect(result).toHaveLength(3);
  expect(result[0]).toEqual({ ...incoming, id: battle.id });
  expect(result[1]).toEqual(unrelated);
  expect(result[2]).toEqual(planned);
  expect(battle.endAt).toBe("2026-11-02T12:00:00Z");
});
it("updates a shared planned ID but preserves separately created identical tries", () => {
  const incoming = {
    ...planned,
    endAt: "2026-11-05T12:00:00Z",
    startAt: "2026-10-31T18:00:00Z",
    plannedAp: 5,
    plannedHealth: 100,
    usesFreeTry: false,
    missed: true,
  };
  const secondTry = { ...incoming, id: "separate-try" };
  const result = mergeImportedFinishes([planned], [incoming, secondTry]);
  expect(result).toEqual([incoming, secondTry]);
  expect(mergeImportedFinishes(result, [incoming, secondTry])).toEqual(result);
});
it("recognizes shared IDs after a rename and collapses any running duplicate at the new identity", () => {
  const duplicate = {
    ...battle,
    id: "duplicate",
    title: "Renamed park",
    type: "Small Blue Mushroom",
  };
  const renamed = {
    ...battle,
    title: duplicate.title,
    type: duplicate.type,
    endAt: "2026-11-06T12:00:00Z",
  };
  expect(mergeImportedFinishes([battle, duplicate], [renamed])).toEqual([
    renamed,
  ]);
});
it("does not combine a separately planned try with a running battle at the same place", () => {
  const samePlace = { ...planned, title: battle.title, type: battle.type };
  const updated = { ...battle, id: "incoming", endAt: "2026-11-06T12:00:00Z" };
  expect(mergeImportedFinishes([samePlace, battle], [updated])).toEqual([
    samePlace,
    { ...updated, id: battle.id },
  ]);
});
it("uses the last incoming observation and is safe to import repeatedly or import an empty plan", () => {
  const first = { ...battle, id: "first", endAt: "2026-11-03T12:00:00Z" };
  const last = { ...battle, id: "last", endAt: "2026-11-04T12:00:00Z" };
  const result = mergeImportedFinishes([battle, planned], [first, last]);
  expect(result).toEqual([{ ...last, id: battle.id }, planned]);
  expect(mergeImportedFinishes(result, [first, last])).toEqual(result);
  expect(mergeImportedFinishes(result, [])).toEqual(result);
});
