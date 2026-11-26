import { initialPlannerFinishes } from "./testFixtures/screenshotMushrooms";
import { recomputeDerived } from "./mushroomCalculator";
import {
  calculatorFormForFinish,
  finishFromCalculator,
} from "./plannerCalculator";
it("calculates an elapsed start from the desired finish and returns absolute instants", () => {
  const original = {
    ...initialPlannerFinishes()[0],
    source: "hypothetical" as const,
  };
  const form = calculatorFormForFinish(original);
  expect(form.derived).toBe("startTime");
  expect(form.endTime?.toISOString()).toBe(original.endAt);
  const result = finishFromCalculator(original, form)!;
  expect(result.id).toBe(original.id);
  expect(result.endAt).toBe(original.endAt);
  expect(Date.parse(result.endAt) - Date.parse(result.startAt!)).toBe(
    ((result.plannedHealth! * 100) / result.plannedAp!) * 1000,
  );
});
it("requires the user to choose unknown seasonal battle health rather than guessing it", () => {
  const original = {
    ...initialPlannerFinishes()[0],
    source: "hypothetical" as const,
    type: "Giant Unknown Event Mushroom",
  };
  const form = calculatorFormForFinish(original);
  expect(form.mush).toBeNull();
  expect(finishFromCalculator(original, form)).toBeNull();
});

it("cannot apply a calculated start to a running screenshot battle", () => {
  const original = initialPlannerFinishes()[0];
  expect(
    finishFromCalculator(original, calculatorFormForFinish(original)),
  ).toBeNull();
});

it("uses manually entered health for an unknown mushroom without requiring a preset", () => {
  const original = {
    ...initialPlannerFinishes()[0],
    source: "hypothetical" as const,
    type: "Large Festival Mushroom",
  };
  const form = recomputeDerived({
    ...calculatorFormForFinish(original),
    health: 3600,
    pikminAp: 100,
  });
  const result = finishFromCalculator(original, form)!;
  expect(result.type).toBe(original.type);
  expect(Date.parse(result.endAt) - Date.parse(result.startAt!)).toBe(3600 * 1000);
});
