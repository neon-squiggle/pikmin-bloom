import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Box,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import LockIcon from "@mui/icons-material/Lock";
import MushCalcLock from "./MushCalcLock";
import MushCalcToggle from "./MushCalcToggle";

const Calculator = () => {
  const [mode, setMode] = useState<"toggle" | "lock">("toggle");

  const handleModeChange = (e: any, value: "toggle" | "lock" | null) => {
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
      </Box>
    </Box>
  );
};

export default Calculator;
