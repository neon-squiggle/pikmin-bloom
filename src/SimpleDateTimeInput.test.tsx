import { fireEvent, render, screen, within } from "@testing-library/react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

import SimpleDateTimeInput from "./SimpleDateTimeInput";
import { setDateField, readDateField } from "./testFixtures/dateFields";

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

const browserTimezone = (timezone: string) => {
  const original = Intl.DateTimeFormat.prototype.resolvedOptions;
  jest.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(function (this: Intl.DateTimeFormat) {
    return { ...original.call(this), timeZone: timezone };
  });
};
afterEach(() => jest.restoreAllMocks());

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

  it.each([
    ["America/Los_Angeles", "2026-11-01T08:30:00Z", "2026-11-01T09:30:00.000Z"],
    ["Europe/Berlin", "2026-10-25T00:30:00Z", "2026-10-25T01:30:00.000Z"],
    ["Australia/Lord_Howe", "2026-04-04T14:45:00Z", "2026-04-04T15:15:00.000Z"],
  ])("selects the second occurrence in %s", (timezone, first, second) => {
    browserTimezone(timezone);
    const onChange = jest.fn();
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SimpleDateTimeInput
          label="End time"
          value={dayjs(first)}
          onChange={onChange}
        />
      </LocalizationProvider>,
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Clock occurrence" }));
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: /Second/ }));
    expect(onChange.mock.calls[0][0].toISOString()).toBe(second);
  });

  it("keeps the second occurrence when its minutes are edited", () => {
    browserTimezone("America/Los_Angeles");
    const onChange = jest.fn();
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SimpleDateTimeInput
          label="End time"
          value={dayjs("2026-11-01T09:30:00Z")}
          onChange={onChange}
        />
      </LocalizationProvider>,
    );
    setDateField(screen.getByRole("group", { name: "End time" }), dayjs("2026-11-01T08:45Z").format("MM/DD/YYYY hh:mm A"));
    expect(onChange.mock.calls.at(-1)[0].toISOString()).toBe("2026-11-01T09:45:00.000Z");
  });

  it("keeps UTC wall-clock editing separate from local repeated hours", () => {
    const onChange = jest.fn();
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SimpleDateTimeInput
          label="End time"
          timezone="UTC"
          value={dayjs.utc("2026-11-01T01:30:00")}
          onChange={onChange}
        />
      </LocalizationProvider>,
    );
    const field = screen.getByRole("group", { name: "End time" });
    expect(readDateField(field)).toBe("11/01/2026 01:30 AM");
    expect(screen.queryByRole("combobox", { name: "Clock occurrence" })).toBeNull();
    setDateField(field, "11/01/2026 01:45 AM");
    expect(onChange.mock.calls.at(-1)[0].format("YYYY-MM-DDTHH:mm")).toBe("2026-11-01T01:45");
  });

  it("disables occurrences outside the allowed instant range", () => {
    browserTimezone("America/Los_Angeles");
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SimpleDateTimeInput
          label="End time"
          value={dayjs("2026-11-01T09:30:00Z")}
          minDateTime={dayjs("2026-11-01T08:45:00Z")}
          onChange={jest.fn()}
        />
      </LocalizationProvider>,
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Clock occurrence" }));
    const options = within(screen.getByRole("listbox"));
    expect(options.getByRole("option", { name: /First/ }).getAttribute("aria-disabled")).toBe("true");
    expect(options.getByRole("option", { name: /Second/ }).getAttribute("aria-disabled")).not.toBe("true");
  });
});
