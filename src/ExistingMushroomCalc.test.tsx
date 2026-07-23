import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";

import ExistingMushroomCalc, {
  ExistingMushroomSeed,
} from "./ExistingMushroomCalc";

const renderCalculator = (
  initialValues?: ExistingMushroomSeed,
  initialDesiredEndTime?: Dayjs,
) =>
  render(
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ExistingMushroomCalc
          initialValues={initialValues}
          initialDesiredEndTime={initialDesiredEndTime}
        />
      </LocalizationProvider>
    </ThemeProvider>,
  );

describe("ExistingMushroomCalc", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts with zero values and no desired end time", () => {
    renderCalculator();

    expect((screen.getByLabelText("Current AP") as HTMLInputElement).value).toBe(
      "0",
    );
    expect(
      (screen.getByLabelText("Health remaining") as HTMLInputElement).value,
    ).toBe("0");
    const desiredEndInput = screen
      .getAllByLabelText("Desired end time")
      .find((element) => element.tagName === "INPUT") as HTMLInputElement;
    expect(desiredEndInput.value).toBe("");
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

    expect(screen.getByTestId("additional-ap-result").textContent).toContain(
      "11.111",
    );

    jest.advanceTimersByTime(5 * 60 * 1000);
    fireEvent.change(screen.getByRole("slider"), {
      target: { value: "600" },
    });

    expect(screen.getByTestId("additional-ap-result").textContent).toContain(
      "14.286",
    );
    expect(screen.queryByText("Add it in 10m")).not.toBeNull();
    expect(
      screen.getByTestId("ap-addition-discord-timestamp").textContent,
    ).toContain(
      "Discord timestamp: <t:1704111000:f>",
    );
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

    expect(screen.getByTestId("additional-ap-result").textContent).toBe(
      "30000",
    );
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

    const rawTotal = screen.getByTestId("additional-ap-result").textContent;
    fireEvent.click(screen.getByLabelText("Divide AP by 3"));

    expect(screen.getByTestId("additional-ap-result").textContent).toBe(
      rawTotal,
    );
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

    expect((screen.getByLabelText("Current AP") as HTMLInputElement).value).toBe(
      "240",
    );
    expect(
      (screen.getByLabelText("Health remaining") as HTMLInputElement).value,
    ).toBe("1,800.5");
  });
});
