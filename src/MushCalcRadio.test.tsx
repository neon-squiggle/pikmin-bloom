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
  it("allows a mushroom to be selected after choosing to derive health", () => {
    renderCalculator();

    fireEvent.click(screen.getByRole("radio", { name: "Starting health" }));

    const mushroomInput = screen.getByLabelText(
      "Mushroom type",
    ) as HTMLInputElement;
    expect(mushroomInput.readOnly).toBe(false);
    expect(mushroomInput.disabled).toBe(false);
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
    expect(healthInput.value).toBe("1800");
  });
});
