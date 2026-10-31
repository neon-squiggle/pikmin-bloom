import "@testing-library/jest-dom";
import { setDateField } from "./testFixtures/dateFields";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";

import ExistingMushroomCalc from "./ExistingMushroomCalc";
import { ExistingMushroomSeed } from "./mushroomCalculator";

const renderCalculator = (
  initialValues?: ExistingMushroomSeed,
  initialDesiredEndTime?: Dayjs,
) => {
  const view = render(
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ExistingMushroomCalc
          initialValues={initialValues}
          initialDesiredEndTime={initialDesiredEndTime}
        />
      </LocalizationProvider>
    </ThemeProvider>,
  );
  return view;
};

describe("ExistingMushroomCalc", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts with blank values and no desired end time", () => {
    renderCalculator();

    expect((screen.getByLabelText("AP") as HTMLInputElement).value).toBe("");
    expect(
      (screen.getByLabelText("Health remaining") as HTMLInputElement).value,
    ).toBe("");
    const desiredEndInput = screen
      .getAllByLabelText("Desired end time")
      .find((element) => element.tagName === "INPUT") as HTMLInputElement;
    expect(desiredEndInput.value).toBe("");
    expect(desiredEndInput.disabled).toBe(true);
    expect(
      screen.queryByText(/With no new players, this battle should finish/),
    ).toBeNull();
    ["Days", "Hours", "Minutes", "Seconds"].forEach((label) => {
      const input = screen
        .getAllByLabelText(label)
        .find((element) => element.tagName === "INPUT") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  it("treats blank duration units as zero and shows the join slider", () => {
    renderCalculator();

    fireEvent.change(screen.getByLabelText("AP"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Health remaining"), {
      target: { value: "3000" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Hours" }), {
      target: { value: "1" },
    });

    const desiredEndInput = screen.getByRole("group", { name: "Desired end time" });
    expect(within(desiredEndInput).getByRole("spinbutton", { name: "Month" }).getAttribute("aria-disabled")).toBe("false");

    setDateField(desiredEndInput, dayjs().add(45, "minute").format("MM/DD/YYYY hh:mm A"));

    expect(screen.getByRole("slider")).not.toBeNull();
  });

  it("shows rounded AP and increases it when the addition is delayed", () => {
    renderCalculator(
      {
        currentAp: 100,
        healthRemaining: 3000,
        timeRemaining: { days: 0, hours: 1, minutes: 0, seconds: 0 },
      },
      dayjs().add(45, "minute"),
    );

    const additionalApInput = screen.getByLabelText(
      "Additional AP",
    ) as HTMLInputElement;
    expect(additionalApInput.value).toBe("11.111");

    act(() => jest.advanceTimersByTime(5 * 60 * 1000));
    fireEvent.change(screen.getByRole("slider"), {
      target: { value: "600" },
    });

    expect(additionalApInput.value).toBe("14.286");
    expect(
      screen.getByRole("button", {
        name: "Copy Bullhorn time Discord timestamp",
      }),
    ).not.toBeNull();
  });

  it("allows AP to be added up to one second before the desired finish", () => {
    renderCalculator(
      {
        currentAp: 100,
        healthRemaining: 3000,
        timeRemaining: { days: 0, hours: 1, minutes: 0, seconds: 0 },
      },
      dayjs().add(45, "minute"),
    );

    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("max")).toBe("2699");

    fireEvent.change(slider, { target: { value: "2699" } });

    expect(
      (screen.getByLabelText("Additional AP") as HTMLInputElement).value,
    ).toBe("30,000");
  });

  it("moves the time slider when the additional AP is edited", () => {
    renderCalculator(
      {
        currentAp: 100,
        healthRemaining: 3000,
        timeRemaining: { days: 0, hours: 1, minutes: 0, seconds: 0 },
      },
      dayjs().add(45, "minute"),
    );

    fireEvent.change(screen.getByLabelText("Additional AP"), {
      target: { value: "20" },
    });

    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("1200");
  });

  it("optionally divides the AP without replacing the total", () => {
    renderCalculator(
      {
        currentAp: 100,
        healthRemaining: 3000,
        timeRemaining: { days: 0, hours: 1, minutes: 0, seconds: 0 },
      },
      dayjs().add(45, "minute"),
    );

    const additionalApInput = screen.getByLabelText(
      "Additional AP",
    ) as HTMLInputElement;
    const total = additionalApInput.value;
    fireEvent.click(screen.getByText("3"));

    expect(additionalApInput.value).toBe(total);
    expect(screen.getByTestId("divided-ap-result").textContent).toContain(
      "3.704 AP each",
    );
  });

  it("prefills an imported new-mushroom snapshot", () => {
    renderCalculator({
      currentAp: 240,
      healthRemaining: 1800.5,
      timeRemaining: { days: 1, hours: 2, minutes: 3, seconds: 4 },
    });

    expect((screen.getByLabelText("AP") as HTMLInputElement).value).toBe("240");
    expect(
      (screen.getByLabelText("Health remaining") as HTMLInputElement).value,
    ).toBe("1,800.5");
  });

  it("uses entered values without showing snapshot discrepancy warnings", () => {
    renderCalculator({
      currentAp: 100,
      healthRemaining: 1000,
      timeRemaining: { days: 1, hours: 0, minutes: 0, seconds: 0 },
    });
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      within(screen.getByRole("group", { name: "Desired end time" })).getByRole("spinbutton", { name: "Month" }).getAttribute("aria-disabled"),
    ).toBe("false");
  });

  it("disables unavailable controls while a duration is cleared", () => {
    renderCalculator(
      {
        currentAp: 100,
        healthRemaining: 3000,
        timeRemaining: { days: 0, hours: 1, minutes: 0, seconds: 0 },
      },
      dayjs().add(45, "minute"),
    );

    const hoursInput = screen.getByRole("textbox", { name: "Hours" });
    expect(screen.getByRole("slider")).not.toBeNull();

    fireEvent.focus(hoursInput);
    fireEvent.change(hoursInput, { target: { value: "" } });

    expect(screen.getByRole("slider")).toBeDisabled();

    fireEvent.blur(hoursInput);
    expect(screen.getByRole("slider")).toBeDisabled();
  });

  it("does not scroll away from the edited duration field", () => {
    renderCalculator();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    const minutesField = screen.getByTestId("duration-minutes");
    const scrollIntoView = jest.fn();
    minutesField.scrollIntoView = scrollIntoView;
    jest.spyOn(minutesField, "getBoundingClientRect").mockReturnValue({
      bottom: 900,
      height: 56,
      left: 0,
      right: 320,
      top: 844,
      width: 320,
      x: 0,
      y: 844,
      toJSON: () => ({}),
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Hours" }), {
      target: { value: "1" },
    });

    expect(scrollIntoView).not.toHaveBeenCalled();

    jest.restoreAllMocks();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalWidth,
    });
  });
});
