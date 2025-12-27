import React, { useState } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import EventIcon from "@mui/icons-material/Event";
import { Mode, mushStages } from "./types";
import MushCalcRadio from "./MushCalcRadio";
import Timeline from "./Timeline";
import MushStages from "./MushStages";

const View = () => {
  const [mode, setMode] = useState<Mode>("calculator");

  const handleModeChange = (e: any, value: Mode) => {
    if (value) setMode(value);
  };

  return (
    <Box display="flex" gap={2}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
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
      <Box sx={{ width: 800, flexGrow: 1 }}>
        {mode === "calculator" && <MushCalcRadio />}
        {mode === "calendar" && <Timeline />}
      </Box>
    </Box>
  );
};

export default View;
