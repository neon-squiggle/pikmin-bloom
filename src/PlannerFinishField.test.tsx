import { fireEvent, render, screen, within } from "@testing-library/react";
import PlannerFinishField from "./PlannerFinishField";
import { setDateField } from "./testFixtures/dateFields";

it("shares the occurrence control and keeps the second occurrence through edits", () => {
  const onChange = jest.fn(), onOccurrenceChange = jest.fn();
  render(<PlannerFinishField
    value="2026-11-01T01:30:00"
    occurrence={String(Date.parse("2026-11-01T09:30Z"))}
    timezone="America/Los_Angeles"
    onChange={onChange}
    onOccurrenceChange={onOccurrenceChange}
  />);
  expect(screen.getAllByRole("combobox", { name: "Clock occurrence" })).toHaveLength(1);
  setDateField(screen.getByRole("group", { name: "End time" }), "11/01/2026 01:45:00 AM");
  expect(onChange).toHaveBeenLastCalledWith("2026-11-01T01:45:00");
  expect(onOccurrenceChange).toHaveBeenLastCalledWith(String(Date.parse("2026-11-01T09:45Z")));
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Clock occurrence" }));
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: /First/ }));
  expect(onOccurrenceChange).toHaveBeenLastCalledWith(String(Date.parse("2026-11-01T08:30Z")));
});
