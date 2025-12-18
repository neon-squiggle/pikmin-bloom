import React, { useState } from "react";
import { Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import { Mode } from "./types";
import LockIcon from "@mui/icons-material/Lock";
import MushCalcLock from "./MushCalcLock";
import MushCalcToggle from "./MushCalcToggle";
import MushCalcRadio from "./MushCalcRadio";

const Calculator = () => {
  const [mode, setMode] = useState<Mode>("radio");

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
          <ToggleButton value="radio">
            <RadioButtonCheckedIcon />
          </ToggleButton>
          <ToggleButton value="toggle">
            <ToggleOnIcon />
          </ToggleButton>
          <ToggleButton value="lock">
            <LockIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ width: 650 }}>
        {mode === "lock" && <MushCalcLock />}
        {mode === "toggle" && <MushCalcToggle />}
        {mode === "radio" && <MushCalcRadio />}
      </Box>
    </Box>
  );
};

export default Calculator;
