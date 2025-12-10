import React from "react";
import { ToggleButtonGroup } from "@mui/material";
import { ToggleButton } from "@mui/material";
import { Estimate } from "./types";

interface ToggleProps {
  mode: Estimate | null;
  handleModeChange: (e: any, value: Estimate) => void;
}

const Toggle = ({ mode, handleModeChange }: ToggleProps) => {
  return (
    <ToggleButtonGroup
      size="small"
      value={mode}
      onChange={handleModeChange}
      exclusive
    >
      <ToggleButton value="health">health</ToggleButton>
      <ToggleButton value="ap">ap</ToggleButton>
      <ToggleButton value="time">time</ToggleButton>
    </ToggleButtonGroup>
  );
};

export default Toggle;
