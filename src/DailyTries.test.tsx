import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DailyTries from "./DailyTries";
import { PlannerFinish } from "./stagePlanner";

const planned = (day: string, index: number, changes: Partial<PlannerFinish> = {}): PlannerFinish => ({
  id: `${day}-${index}`,
  title: "Daily mushroom",
  type: "",
  endAt: "2026-11-02T18:00:00Z",
  source: "hypothetical",
  status: "planned",
  tryDay: day,
  ...changes,
});
const props = {
  timezone: "UTC",
  eventMonth: "2026-11",
  now: Date.parse("2026-10-30T17:00:00Z"),
};
const open = () => fireEvent.click(screen.getByRole("button", { name: "Daily tries" }));

it("shows daily accounting without a second mushroom entry form or actionable date chips", () => {
  render(<DailyTries {...props} finishes={[]} onClear={jest.fn()} />);
  open();
  expect(screen.getByText("Oct 31 · 0/3")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Oct 31 · 0/3" })).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add try" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Calculate start time" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Clear daily tries" })).toBeDisabled();
});

it("uses one availability color for unaccounted days, keeps missed starts counted, and excludes tickets", () => {
  render(<DailyTries {...props} finishes={[
    planned("2026-10-31", 0, { missed: true }),
    planned("2026-10-31", 1, { usesFreeTry: false }),
    ...[0, 1, 2, 3].map(index => planned("2026-11-01", index)),
  ]} onClear={jest.fn()} />);
  open();
  expect(screen.getByRole("listitem", { name: "Oct 30 · 0/3" })).toHaveClass("MuiChip-colorPrimary");
  expect(screen.getByRole("listitem", { name: "Oct 31 · 1/3" })).toHaveClass("MuiChip-colorPrimary");
  expect(screen.getByRole("listitem", { name: "Nov 1 · 4/3" })).toHaveClass("MuiChip-colorSuccess");
});

it("retains date expansion and batch clearing", () => {
  const clear = jest.fn();
  render(<DailyTries {...props} finishes={[planned("2026-10-31", 0)]} onClear={clear} />);
  open();
  expect(screen.queryByRole("button", { name: "Show fewer start dates" })).not.toBeInTheDocument();
  expect(screen.queryByText("Nov 8 · 0/3")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show more start dates" }));
  expect(screen.getByText("Nov 8 · 0/3")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show fewer start dates" }));
  expect(screen.queryByText("Nov 8 · 0/3")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear daily tries" }));
  expect(clear).toHaveBeenCalledTimes(1);
});


it.each([false, true])("dismisses daily tries and restores focus on %s mobile", async (mobile) => {
  const original = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: mobile && query.includes("max-width:599.95px"),
    media: query,
    onchange: null,
    addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  try {
    render(<DailyTries {...props} finishes={[]} onClear={jest.fn()} />);
    const trigger = screen.getByRole("button", { name: "Daily tries" });
    trigger.focus();
    open();
    expect(screen.getByRole("dialog", { name: "Daily tries" })).toBeVisible();
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Daily tries" }), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Daily tries" })).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(trigger).toHaveFocus());
  } finally {
    window.matchMedia = original;
  }
});
