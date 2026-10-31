import React from "react";
import { CssBaseline, useMediaQuery } from "@mui/material";
import Container from "@mui/material/Container";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ThemeProvider } from "@mui/material/styles";
import View from "./View";
import appTheme from "./theme";
import UpdateNotifier from "./UpdateNotifier";
import { mobileNavigationHeight } from "./types";
import useMobileKeyboard from "./useMobileKeyboard";
import { ActionFeedbackProvider } from "./ActionFeedback";

function App() {
  const isMobile = useMediaQuery(appTheme.breakpoints.down("sm"));
  const keyboard = useMobileKeyboard(isMobile);
  return (
    <ThemeProvider theme={appTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container
          sx={{
            p: { xs: 0, sm: 2, md: 3 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: { xs: "flex-start", md: "center" },
            alignItems: { xs: "stretch", md: "center" },
            overflow: { xs: "visible", md: "hidden" },
            width: "100%",
            pb: {
              xs: `calc(${keyboard.open ? 24 : mobileNavigationHeight + 16}px + env(safe-area-inset-bottom) + ${keyboard.bottomInset}px)`,
              sm: 3,
            },
            pl: { xs: "env(safe-area-inset-left)", sm: 2, md: 3 },
            pr: { xs: "env(safe-area-inset-right)", sm: 2, md: 3 },
            minHeight: "100dvh",
          }}
        >
          <CssBaseline />
          <ActionFeedbackProvider>
            <View keyboardOpen={keyboard.open} />
            <UpdateNotifier />
          </ActionFeedbackProvider>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
