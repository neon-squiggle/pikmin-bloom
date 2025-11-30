import React from "react";
import { CssBaseline } from "@mui/material";
import Calculator from "./MushCalculator";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import "./App.css";

const darkTheme = createTheme({ palette: { mode: "dark" } });
function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Calculator />
    </ThemeProvider>
  );
}

export default App;
