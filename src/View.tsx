import React, { useState } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  BottomNavigation,
  useMediaQuery,
  useTheme,
  BottomNavigationAction,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import EventIcon from "@mui/icons-material/Event";
import { Mode, navbarHeight } from "./types";
import MushCalcRadio from "./MushCalcRadio";
import Timeline from "./Timeline";
import MushStages from "./MushStages";

const View = () => {
  const [mode, setMode] = useState<Mode>("calculator");
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const handleModeChange = (e: any, value: Mode) => {
    if (value) setMode(value);
  };

  return (
    <Box
      display="flex"
      gap={2}
      sx={{ flexDirection: { xs: "column", md: "row" } }}
    >
      {!isSmall && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mr: { xs: 0, md: 2 },
            mb: { xs: 2, md: 0 },
          }}
        >
          <ToggleButtonGroup
            value={mode}
            onChange={handleModeChange}
            exclusive
            orientation="vertical"
          >
            <ToggleButton value="calculator">
              <CalculateIcon />
            </ToggleButton>
            <ToggleButton value="calendar">
              <EventIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          {mode === "calendar" && <MushStages />}
        </Box>
      )}
      <Box
        sx={{
          width: { xs: "100%", md: "800px" },
          // height: {
          //   xs: `calc(100dvh - ${navbarHeight}px)`,
          //   md: `calc(100dvh - ${navbarHeight}px)`,
          // },
          maxWidth: { md: "800px" },
          flexGrow: 1,
        }}
      >
        {mode === "calculator" && <MushCalcRadio />}
        {mode === "calendar" && <Timeline />}
      </Box>
      {/* <Box> */}
      <BottomNavigation
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          height: navbarHeight,
        }}
      >
        <BottomNavigationAction
          label="calculator"
          value="calculator"
          icon={<CalculateIcon />}
          onClick={() => setMode("calculator")}
        />
        <BottomNavigationAction
          label="calendar"
          value="calendar"
          icon={<EventIcon />}
          onClick={() => setMode("calendar")}
        />
      </BottomNavigation>
      {/* </Box> */}
    </Box>
  );
};

export default View;
