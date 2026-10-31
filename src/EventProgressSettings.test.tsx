import { fireEvent, render, screen } from "@testing-library/react";
import EventProgressSettings from "./EventProgressSettings";

const progress = {
  stage: 3,
  step: 3,
  counted: 2,
  asOf: "2026-11-01T12:00:00Z",
};

it("saves valid edits immediately and keeps the saved cutoff on unchanged focus/blur", () => {
  const change = jest.fn();
  render(<EventProgressSettings progress={progress} onChange={change} />);
  const stage = screen.getByRole("textbox", { name: "Stage" });
  const counted = screen.getByRole("textbox", {
    name: "Mushrooms already counted",
  });
  fireEvent.focus(stage);
  fireEvent.blur(stage);
  fireEvent.focus(counted);
  fireEvent.blur(counted);
  expect(change).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
  fireEvent.change(counted, { target: { value: "3" } });
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({ stage: 3, step: 3, counted: 3 }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
  expect(change).toHaveBeenLastCalledWith(undefined);
});

it("does not establish progress just by visiting the default fields or entering an invalid stage", () => {
  const change = jest.fn();
  render(<EventProgressSettings onChange={change} />);
  const stage = screen.getByRole("textbox", { name: "Stage" });
  fireEvent.focus(stage);
  fireEvent.blur(stage);
  fireEvent.change(stage, { target: { value: "0" } });
  fireEvent.blur(stage);
  expect(change).not.toHaveBeenCalled();
  fireEvent.change(stage, { target: { value: "5" } });
  expect(change).toHaveBeenLastCalledWith(
    expect.objectContaining({ stage: 5, step: 1, counted: 0 }),
  );
});
