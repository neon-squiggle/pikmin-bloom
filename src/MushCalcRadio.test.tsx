import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import MushCalcRadio from "./MushCalcRadio";

const renderCalculator = () =>
  render(
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MushCalcRadio />
      </LocalizationProvider>
    </ThemeProvider>,
  );

describe("MushCalcRadio", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts blank with visible calculation choices", () => {
    renderCalculator();

    screen.getAllByRole("radio").forEach((radio) => {
      expect((radio as HTMLInputElement).checked).toBe(false);
    });
    expect(
      (screen.getByLabelText("Mushroom type") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Starting health",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Starting AP",
        }) as HTMLInputElement
      ).value,
    ).toBe("2");
    expect(
      (screen.getByLabelText(
        "Copy Start time Discord timestamp",
      ) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(
      (screen.getByLabelText(
        "Copy End time Discord timestamp",
      ) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Battle start time") as HTMLInputElement).type,
    ).toBe("text");
  });

  it("fills full health and the initial minimum AP from one mushroom selection", () => {
    renderCalculator();

    const mushroomInput = screen.getByLabelText("Mushroom type");
    fireEvent.change(mushroomInput, { target: { value: "Normal Fire" } });
    fireEvent.click(screen.getByRole("option", { name: "Normal Fire" }));

    expect(
      (
        screen.getByRole("textbox", {
          name: "Starting health",
        }) as HTMLInputElement
      ).value,
    ).toBe("3,850,200");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Starting AP",
        }) as HTMLInputElement
      ).value,
    ).toBe("1,040");
  });

  it("keeps the estimated end time visible and makes it editable for another target", () => {
    renderCalculator();
    const getEndTimeInput = () =>
      screen
        .getAllByLabelText("Estimated end time")
        .find(
          (element) => element.getAttribute("type") !== "radio",
        ) as HTMLInputElement;

    fireEvent.click(
      screen.getByRole("radio", { name: "Estimated end time" }),
    );
    expect(getEndTimeInput().readOnly).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Starting AP" }));

    expect(getEndTimeInput().type).toBe("text");
    expect(getEndTimeInput().readOnly).toBe(false);
    expect(
      (
        screen.getByRole("textbox", {
          name: "Starting AP",
        }) as HTMLInputElement
      ).readOnly,
    ).toBe(true);
  });

  it("accepts a typed estimated end time and creates its Discord timestamp", () => {
    renderCalculator();
    const endTimeInput = screen
      .getAllByLabelText("Estimated end time")
      .find(
        (element) => element.getAttribute("type") === "text",
      ) as HTMLInputElement;

    fireEvent.change(endTimeInput, {
      target: { value: "01/02/2030 12:30 PM" },
    });

    expect(endTimeInput.value).toBe("01/02/2030 12:30 PM");
    expect(
      (
        screen.getByLabelText(
          "End time Discord timestamp",
        ) as HTMLInputElement
      ).value,
    ).toMatch(/^<t:\d+:f>$/);
  });

  it("uses a numeric keyboard and strips non-numeric AP characters", () => {
    renderCalculator();

    const apInput = screen.getByRole("textbox", { name: "Starting AP" });
    expect(apInput.getAttribute("inputmode")).toBe("numeric");
    fireEvent.focus(apInput);
    fireEvent.change(apInput, { target: { value: "12abc,500" } });
    fireEvent.blur(apInput);

    expect((apInput as HTMLInputElement).value).toBe("12,500");
  });

  it("preserves an in-progress battle while switching tabs", () => {
    renderCalculator();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Plan a battle in progress",
      }),
    );
    const apInput = screen.getByLabelText("AP") as HTMLInputElement;
    const healthInput = screen.getByLabelText(
      "Health remaining",
    ) as HTMLInputElement;
    fireEvent.change(apInput, { target: { value: "240" } });
    fireEvent.change(healthInput, { target: { value: "1800" } });

    fireEvent.click(screen.getByRole("button", { name: "Plan a new battle" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Plan a battle in progress",
      }),
    );

    expect(apInput.value).toBe("240");
    expect(healthInput.value).toBe("1,800");
  });
});
