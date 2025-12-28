import React from "react";
import { CssBaseline } from "@mui/material";
import Container from "@mui/material/Container";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import View from "./View";

const darkTheme = createTheme({ palette: { mode: "dark" } });
function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container
          sx={{
            p: { xs: 2, md: 3 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: { xs: "flex-start", md: "center" },
            alignItems: { xs: "stretch", md: "center" },
            overflow: "hidden",
            width: "100%",
          }}
        >
          <CssBaseline />
          <View />
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
