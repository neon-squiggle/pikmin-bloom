import React, { useState, useEffect } from "react";
import { Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import EventIcon from "@mui/icons-material/Event";
import { MushroomTry, Mode } from "./types";
import MushCalcRadio from "./MushCalcRadio";
import Timeline from "./Timeline";

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
      </Box>
      <Box sx={{ width: 800, minHeight: 900 }}>
        {mode === "calculator" && <MushCalcRadio />}
        {mode === "calendar" && <Timeline />}
      </Box>
    </Box>
  );
};

export default View;
