import { act, fireEvent, render, screen } from "@testing-library/react";
import usePlannerState from "./usePlannerState";
import {
  emptyPlanner,
  PlannerFinish,
  PLANNER_STORAGE_KEY,
} from "./stagePlanner";

const battle = (id: string): PlannerFinish => ({
  id,
  title: id,
  type: "Small Red Mushroom",
  source: "manual",
  endAt: "2026-11-02T12:00:00Z",
});
const Tab = ({ id }: { id: string }) => {
  const [state, update, storageError, , retry] = usePlannerState("UTC");
  return (
    <>
      <button
        onClick={() =>
          update((before) => ({
            ...before,
            finishes: [...before.finishes, battle(id)],
          }))
        }
      >
        Add {id}
      </button>
      <button
        onClick={() =>
          update((before) => ({ ...before, minimumGapMinutes: 30 }))
        }
      >
        Settings {id}
      </button>
      {storageError && <button onClick={retry}>Retry save {id}</button>}
      <output aria-label={`Records ${id}`}>
        {state.finishes
          .map((item) => item.id)
          .sort()
          .join(",")}
      </output>
    </>
  );
};
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());
it("preserves both additions when two already-open tabs save, even before a storage event arrives", () => {
  render(
    <>
      <Tab id="A" />
      <Tab id="B" />
    </>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add A" }));
  fireEvent.click(screen.getByRole("button", { name: "Add B" }));
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.map(
      (item: PlannerFinish) => item.id,
    ),
  ).toEqual(["A", "B"]);
  fireEvent.click(screen.getByRole("button", { name: "Settings A" }));
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes,
  ).toHaveLength(2);
});
it("reconciles racing writes and remote deletions via storage events", () => {
  const initial = emptyPlanner("UTC");
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(initial));
  render(<Tab id="A" />);
  fireEvent.click(screen.getByRole("button", { name: "Add A" }));
  const concurrent = { ...initial, finishes: [battle("B")] };
  act(() => {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(concurrent));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: PLANNER_STORAGE_KEY,
        oldValue: JSON.stringify(initial),
        newValue: JSON.stringify(concurrent),
      }),
    );
  });
  expect(screen.getByLabelText("Records A").textContent).toBe("A,B");
  const before = localStorage.getItem(PLANNER_STORAGE_KEY)!;
  const deleted = { ...initial, finishes: [battle("B")] };
  act(() => {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(deleted));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: PLANNER_STORAGE_KEY,
        oldValue: before,
        newValue: JSON.stringify(deleted),
      }),
    );
  });
  fireEvent.click(screen.getByRole("button", { name: "Settings A" }));
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.map(
      (item: PlannerFinish) => item.id,
    ),
  ).toEqual(["B"]);
});

it("keeps unsaved additions in memory across a storage failure and retries them with the next edit", () => {
  render(<Tab id="A" />);
  jest.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
    throw new Error("Storage full");
  });
  fireEvent.click(screen.getByRole("button", { name: "Add A" }));
  expect(screen.getByLabelText("Records A").textContent).toBe("A");
  fireEvent.click(screen.getByRole("button", { name: "Settings A" }));
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.map(
      (item: PlannerFinish) => item.id,
    ),
  ).toEqual(["A"]);
});

it("retries unsaved additions without replacing records saved by another tab", () => {
  render(<Tab id="A" />);
  jest.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("Full"); });
  fireEvent.click(screen.getByRole("button", { name: "Add A" }));
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify({ ...emptyPlanner("UTC"), finishes: [battle("B")] }));
  fireEvent.click(screen.getByRole("button", { name: "Retry save A" }));
  expect(JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.map((item: PlannerFinish) => item.id).sort()).toEqual(["A", "B"]);
  expect(screen.queryByRole("button", { name: "Retry save A" })).toBeNull();
});
