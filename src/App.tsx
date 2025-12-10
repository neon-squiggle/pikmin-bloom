import React, { useState } from "react";
import { CssBaseline, ToggleButton, ToggleButtonGroup } from "@mui/material";
import Container from "@mui/material/Container";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Calculator from "./Calculator";

const darkTheme = createTheme({ palette: { mode: "dark" } });
function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            width: "100vw",
          }}
        >
          <CssBaseline />
          <Calculator />
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
