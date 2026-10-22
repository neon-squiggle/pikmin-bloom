import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

import JoinPlanner from "./JoinPlanner";

const referenceTime = dayjs("2024-01-01T12:00:00");

const renderPlannedJoin = (
  variant: "planned" | "in-progress" = "in-progress",
  startTime = referenceTime,
) =>
  render(
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <JoinPlanner
          variant={variant}
          currentAp={100}
          healthRemaining={3000}
          referenceTime={startTime}
          baselineEndTime={startTime.add(1, "hour")}
          initialTargetEndTime={startTime.add(45, "minute")}
        />
      </LocalizationProvider>
    </ThemeProvider>,
  );

describe("JoinPlanner", () => {
  it("shows and copies the desired end-time Discord timestamp", () => {
    const writeText = jest.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderPlannedJoin();

    expect(screen.queryByText("<t:1704141900:f>")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy Desired end time Discord timestamp",
      }),
    );

    expect(writeText).toHaveBeenCalledWith("<t:1704141900:f>");
  });

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
      screen.getByText("With additional players, when should the battle end?"),
    ).not.toBeNull();
    expect(screen.queryByText("Finish with the starting group")).toBeNull();
    expect(screen.getByLabelText("Desired end time")).not.toBeNull();
    expect(screen.getByText("12:00:00 PM")).not.toBeNull();
    expect(screen.getByText("12:44:59 PM")).not.toBeNull();
  });

  it("starts an in-progress join at now", () => {
    renderPlannedJoin();

    expect(
      screen.getByText("With additional players, when should the battle end?"),
    ).not.toBeNull();
    expect(screen.getByText(/If you bullhorn at/)).not.toBeNull();
    expect(
      screen.getByText("then, in total, you’ll need an additional"),
    ).not.toBeNull();
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

    const bullhornTime = screen.getByRole("textbox", { name: "Bullhorn time" });
    expect((bullhornTime as HTMLInputElement).readOnly).toBe(false);
    const slider = screen.getByRole("slider", { name: "Bullhorn time" });
    expect(slider.getAttribute("aria-valuetext")).toBe("11.111 AP");
    const additionalAp = screen.getByLabelText(
      "Required total additional AP",
    );
    expect(
      bullhornTime.compareDocumentPosition(slider) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      slider.compareDocumentPosition(additionalAp) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.change(slider, {
      target: { value: "600" },
    });

    expect(slider.getAttribute("aria-valuetext")).toBe("14.286 AP");
    expect((bullhornTime as HTMLInputElement).value).toBe(
      "01/01/2024 12:10:00 PM",
    );

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
    expect(
      (screen.getByRole("textbox", { name: "Bullhorn time" }) as HTMLInputElement)
        .value,
    ).toBe("01/01/2024 12:20:00 PM");
  });

  it("keeps the total AP wording in the sentence with a hidden input label", () => {
    renderPlannedJoin();

    const result = screen.getByTestId("additional-ap-result");
    expect(
      screen.getByText("then, in total, you’ll need an additional"),
    ).not.toBeNull();
    expect(
      window.getComputedStyle(screen.getByText("Required total additional AP"))
        .position,
    ).toBe("absolute");
    expect(result.textContent).toContain("AP");
  });

  it.each(["planned", "in-progress"] as const)(
    "updates the slider, AP totals, and timestamp when bullhorn time is edited for a %s battle",
    (variant) => {
      const writeText = jest.fn();
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      renderPlannedJoin(variant);
      fireEvent.click(screen.getByRole("button", { name: "4 joining players" }));

      fireEvent.change(screen.getByRole("textbox", { name: "Bullhorn time" }), {
        target: { value: "01/01/2024 12:10:00 PM" },
      });

      expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("600");
      expect(
        (screen.getByLabelText("Required total additional AP") as HTMLInputElement).value,
      ).toBe("14.286");
      expect(screen.getByTestId("divided-ap-result").textContent).toContain(
        "each person needs 3.572 AP.",
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: "Copy Bullhorn time Discord timestamp",
        }),
      );
      expect(writeText).toHaveBeenCalledWith(
        `<t:${referenceTime.add(10, "minute").unix()}:f>`,
      );
    },
  );

  it("accepts a bullhorn time on the next day through the last allowed second", () => {
    const startTime = dayjs("2024-01-01T23:30:00");
    renderPlannedJoin("planned", startTime);

    fireEvent.change(screen.getByRole("textbox", { name: "Bullhorn time" }), {
      target: { value: "01/02/2024 12:14:59 AM" },
    });

    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("2699");
    expect(
      (screen.getByLabelText("Required total additional AP") as HTMLInputElement).value,
    ).toBe("30,000");

    fireEvent.change(screen.getByRole("slider"), { target: { value: "0" } });
    expect(
      (screen.getByRole("textbox", { name: "Bullhorn time" }) as HTMLInputElement)
        .value,
    ).toBe("01/01/2024 11:30:00 PM");
  });

  it.each([
    ["before the battle starts", "01/01/2024 11:59:59 AM"],
    ["at the desired finish", "01/01/2024 12:45:00 PM"],
    ["after the desired finish", "01/01/2024 01:00:00 PM"],
    ["cleared", ""],
    ["incomplete", "01/01/2024 hh:10:00 PM"],
  ])("keeps valid calculations when the bullhorn time is %s", (_, value) => {
    renderPlannedJoin();

    fireEvent.change(screen.getByRole("textbox", { name: "Bullhorn time" }), {
      target: { value },
    });

    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("0");
    expect(
      (screen.getByLabelText("Required total additional AP") as HTMLInputElement).value,
    ).toBe("11.111");

    fireEvent.change(screen.getByRole("textbox", { name: "Bullhorn time" }), {
      target: { value: "01/01/2024 12:20:00 PM" },
    });
    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("1200");
  });

  it("defaults to one joining player and can divide among four", () => {
    renderPlannedJoin();

    expect(
      screen
        .getByRole("button", { name: "1 joining player" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByTestId("divided-ap-result").textContent).toContain(
      "each person needs 11.111 AP.",
    );
    fireEvent.change(screen.getByRole("slider"), {
      target: { value: "600" },
    });
    fireEvent.click(screen.getByText("4"));

    expect(screen.getByTestId("divided-ap-result").textContent).toContain(
      "each person needs 3.572 AP.",
    );
    expect(screen.getByText("players are joining,")).not.toBeNull();
  });

  it.each([
    ["mobile", 390],
    ["desktop", 1280],
  ])(
    "scrolls revealed results into view on %s without blurring the input",
    (_, width) => {
      const originalWidth = window.innerWidth;
      const originalScrollIntoView = Element.prototype.scrollIntoView;
      const scrollIntoView = jest.fn();
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: width,
      });
      Element.prototype.scrollIntoView = scrollIntoView;

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

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "nearest",
      });
      expect(blur).not.toHaveBeenCalled();

      blur.mockRestore();
      Element.prototype.scrollIntoView = originalScrollIntoView;
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: originalWidth,
      });
    },
  );
});
