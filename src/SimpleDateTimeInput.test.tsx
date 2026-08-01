import { fireEvent, render, screen } from "@testing-library/react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

import SimpleDateTimeInput from "./SimpleDateTimeInput";

const renderInput = (showNowAction: boolean) =>
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <SimpleDateTimeInput
        label={showNowAction ? "Start" : "End"}
        value={showNowAction ? dayjs() : null}
        onChange={jest.fn()}
        showNowAction={showNowAction}
      />
    </LocalizationProvider>,
  );

describe("SimpleDateTimeInput", () => {
  it("labels the start-time current-moment shortcut as Now", () => {
    renderInput(true);

    fireEvent.click(screen.getByLabelText(/Choose date, selected date is/));

    expect(screen.getByRole("button", { name: "Now" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
  });

  it("does not offer a current-time shortcut for an end time", () => {
    renderInput(false);

    fireEvent.click(screen.getByLabelText("Choose date"));

    expect(screen.queryByRole("button", { name: "Now" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
  });
});
