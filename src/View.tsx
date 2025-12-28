import React, { useState } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import EventIcon from "@mui/icons-material/Event";
import { Mode } from "./types";
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
          orientation={isSmall ? "horizontal" : "vertical"}
        >
          <ToggleButton value="calculator">
            <CalculateIcon />
          </ToggleButton>
          <ToggleButton value="calendar">
            <EventIcon />
          </ToggleButton>
        </ToggleButtonGroup>
        {mode === "calendar" && !isSmall && <MushStages />}
      </Box>
      <Box
        sx={{
          width: { xs: "100%", md: "800px" },
          maxWidth: { md: "800px" },
          flexGrow: 1,
        }}
      >
        {mode === "calculator" && <MushCalcRadio />}
        {mode === "calendar" && <Timeline />}
      </Box>
    </Box>
  );
};

export default View;
