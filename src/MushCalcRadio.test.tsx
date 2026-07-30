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

    fireEvent.click(
      screen.getByRole("radio", { name: "Starting health" }),
    );

    const mushroomInput = screen.getByLabelText(
      "Mushroom type",
    ) as HTMLInputElement;
    expect(mushroomInput.readOnly).toBe(false);
    expect(mushroomInput.disabled).toBe(false);
  });
});
