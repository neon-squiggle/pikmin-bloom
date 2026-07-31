import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

import JoinPlanner from "./JoinPlanner";

const referenceTime = dayjs("2024-01-01T12:00:00");

const renderPlannedJoin = () =>
  render(
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <JoinPlanner
          variant="in-progress"
          currentAp={100}
          healthRemaining={3000}
          referenceTime={referenceTime}
          baselineEndTime={referenceTime.add(1, "hour")}
          initialTargetEndTime={referenceTime.add(45, "minute")}
        />
      </LocalizationProvider>
    </ThemeProvider>,
  );

describe("JoinPlanner", () => {
  it("presents the join controls as optional for a planned battle", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <JoinPlanner
            variant="planned"
            currentAp={100}
            healthRemaining={3000}
            referenceTime={referenceTime}
            baselineEndTime={referenceTime.add(1, "hour")}
            initialTargetEndTime={referenceTime.add(45, "minute")}
          />
        </LocalizationProvider>
      </ThemeProvider>,
    );

    expect(
      screen.getByText(
        "Optional: with additional players, when should the battle end?",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("Finish with the starting group")).toBeNull();
    expect(screen.getByText("Join at battle start")).not.toBeNull();
    expect(screen.getByText("Battle start")).not.toBeNull();
  });

  it("starts an in-progress join at now", () => {
    renderPlannedJoin();

    expect(
      screen.getByText("With additional players, when should the battle end?"),
    ).not.toBeNull();
    expect(screen.getByText("Join now")).not.toBeNull();
    expect(
      (
        screen.getByLabelText(
          "Required total additional AP",
        ) as HTMLInputElement
      ).value,
    ).toBe("11.111");
  });

  it("updates required AP as the joining group is delayed", () => {
    renderPlannedJoin();

    fireEvent.change(screen.getByRole("slider"), {
      target: { value: "600" },
    });

    expect(screen.getByText("Join in 10m")).not.toBeNull();
    expect(
      (
        screen.getByLabelText(
          "Required total additional AP",
        ) as HTMLInputElement
      ).value,
    ).toBe("14.286");
  });

  it("moves the slider when total joining AP is edited", () => {
    renderPlannedJoin();

    fireEvent.change(screen.getByLabelText("Required total additional AP"), {
      target: { value: "20" },
    });

    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("1200");
    expect(screen.getByText("Join in 20m")).not.toBeNull();
  });

  it("uses a stable full-width AP control without a duplicate heading", () => {
    renderPlannedJoin();

    const result = screen.getByTestId("additional-ap-result");
    expect(result.textContent).toContain("Required total additional AP");
  });

  it("defaults to one joining player and can divide among four", () => {
    renderPlannedJoin();

    expect(screen.getByTestId("divided-ap-result").textContent).toContain(
      "11.111 AP per player",
    );
    fireEvent.change(screen.getByRole("slider"), {
      target: { value: "600" },
    });
    fireEvent.click(screen.getByText("4"));

    expect(screen.getByTestId("divided-ap-result").textContent).toContain(
      "3.572 AP per player",
    );
  });

  it("scrolls to the bottom after a mobile user sets an end time", () => {
    const originalWidth = window.innerWidth;
    const originalScrollTo = window.scrollTo;
    const scrollTo = jest.fn();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2000,
    });
    window.scrollTo = scrollTo;

    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <JoinPlanner
            variant="in-progress"
            currentAp={100}
            healthRemaining={3000}
            referenceTime={referenceTime}
            baselineEndTime={referenceTime.add(1, "hour")}
          />
        </LocalizationProvider>
      </ThemeProvider>,
    );

    const desiredEndInput = screen.getByLabelText("Desired end time");
    fireEvent.focus(desiredEndInput);
    const blur = jest.spyOn(HTMLElement.prototype, "blur");
    fireEvent.change(desiredEndInput, {
      target: { value: "01/01/2024 12:45 PM" },
    });

    expect(scrollTo).toHaveBeenCalledWith({
      behavior: "smooth",
      top: 2000,
    });
    expect(blur).not.toHaveBeenCalled();

    blur.mockRestore();
    window.scrollTo = originalScrollTo;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalWidth,
    });
  });
});
