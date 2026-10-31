import "@testing-library/jest-dom";
import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import PlannedTryFields, { PlannedTryInput } from "./PlannedTryFields";

const Form = () => {
  const [value, setValue] = useState<PlannedTryInput>({
    title: "",
    wallTime: "2026-11-04T18:00:00",
    occurrence: "",
    tryDay: "2026-11-03",
    type: "",
    extraTry: false,
  });
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <PlannedTryFields
        timezone="UTC"
        types={[]}
        value={value}
        onChange={(changes) =>
          setValue((previous) => ({ ...previous, ...changes }))
        }
      />
    </LocalizationProvider>
  );
};
it("disables start days after the end date in the calendar", () => {
  render(<Form />);
  fireEvent.click(
    screen.getByRole("button", {
      name: "Choose date, selected date is Nov 3, 2026",
    }),
  );
  const calendar = within(screen.getByRole("dialog"));
  expect(calendar.getByRole("gridcell", { name: "5" })).toBeDisabled();
  expect(calendar.getByRole("gridcell", { name: "4" })).not.toBeDisabled();
});
it("disables end days before the start date in the calendar", () => {
  render(<Form />);
  fireEvent.click(
    screen.getByRole("button", {
      name: "Choose date, selected date is Nov 4, 2026",
    }),
  );
  const calendar = within(screen.getByRole("dialog"));
  expect(calendar.getByRole("gridcell", { name: "2" })).toBeDisabled();
  expect(calendar.getByRole("gridcell", { name: "3" })).not.toBeDisabled();
  expect(
    screen.queryByText("End time must be on or after start date."),
  ).toBeNull();
});
