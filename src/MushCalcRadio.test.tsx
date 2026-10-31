import { setDateField, readDateField } from "./testFixtures/dateFields";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("starts blank with end time selected as the calculation target", () => {
    renderCalculator();

    expect(
      (screen.getByRole("radio", { name: "End time" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Mushroom type") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Health",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("textbox", {
          name: "AP",
        }) as HTMLInputElement
      ).value,
    ).toBe("2");
    expect(
      (
        screen.getByLabelText(
          "Copy Start time Discord timestamp",
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(
      screen.queryByLabelText("Copy End time Discord timestamp"),
    ).toBeNull();
    expect(screen.getByRole("group", { name: "Battle start time" })).not.toBeNull();
  });

  it("fills full health and the initial minimum AP from one mushroom selection", () => {
    renderCalculator();

    const mushroomInput = screen.getByLabelText("Mushroom type");
    fireEvent.change(mushroomInput, { target: { value: "Normal Fire" } });
    fireEvent.click(screen.getByRole("option", { name: "Normal Fire" }));

    expect(
      (
        screen.getByRole("textbox", {
          name: "Health",
        }) as HTMLInputElement
      ).value,
    ).toBe("3,850,200");
    expect(
      (
        screen.getByRole("textbox", {
          name: "AP",
        }) as HTMLInputElement
      ).value,
    ).toBe("1,040");
  });

  it("keeps the estimated end time visible and makes it editable for another target", () => {
    renderCalculator();
    const getEndTimeInput = () => within(screen.getByRole("group", { name: "End time" })).getByRole("spinbutton", { name: "Month" });

    fireEvent.click(screen.getByRole("radio", { name: "End time" }));
    expect(getEndTimeInput().getAttribute("aria-readonly")).toBe("true");

    fireEvent.click(screen.getByRole("radio", { name: "AP" }));

        expect(getEndTimeInput().getAttribute("aria-readonly")).toBe("false");
    expect(
      (
        screen.getByRole("textbox", {
          name: "AP",
        }) as HTMLInputElement
      ).readOnly,
    ).toBe(true);
  });

  it("accepts a typed estimated end time and creates its Discord timestamp", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("radio", { name: "AP" }));
    const endTimeInput = screen.getByRole("group", { name: "End time" });

    setDateField(endTimeInput, "01/02/2030 12:30 PM");

    expect(readDateField(endTimeInput)).toBe("01/02/2030 12:30 PM");
    expect(
      screen.getByLabelText("Copy End time Discord timestamp"),
    ).not.toBeNull();
  });

  it("uses a numeric keyboard and preserves invalid input for correction", () => {
    renderCalculator();

    const apInput = screen.getByRole("textbox", { name: "AP" });
    expect(apInput.getAttribute("inputmode")).toBe("numeric");
    fireEvent.focus(apInput);
    fireEvent.change(apInput, { target: { value: "12abc,500" } });
    fireEvent.blur(apInput);

    expect((apInput as HTMLInputElement).value).toBe("12abc,500");
    expect(apInput.getAttribute("aria-invalid")).toBe("true");
  });

  it("preserves an in-progress battle while switching tabs", () => {
    renderCalculator();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Plan a battle in progress",
      }),
    );
    const apInput = screen.getByRole("textbox", {
      name: "AP",
    }) as HTMLInputElement;
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

    expect(
      (screen.getByRole("textbox", { name: "AP" }) as HTMLInputElement).value,
    ).toBe("240");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Health remaining",
        }) as HTMLInputElement
      ).value,
    ).toBe("1,800");
  });
});
