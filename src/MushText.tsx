import React from "react";
import { Typography } from "@mui/material";
import { Estimate } from "./types";

interface TextProps {
  ap: boolean;
  time: boolean;
  health: boolean;
  mode: Estimate | null;
}

const Text = ({ ap, time, health, mode }: TextProps) => {
  const changeable = ["ap", "time", "health"].filter((val) => val !== mode);

  const message = () => {
    if (!mode && !time && !ap && !health)
      return "Welcome! Set any one variable to continue";
    if (!mode)
      return "No variables have been held constant; any updated calculations are going to be random until you mode a variable";
    return `${mode} is held constant; set ${changeable[0]} to calculate ${changeable[1]}, or vice versa`;
  };

  return (
    <Typography gutterBottom variant="body1" sx={{ color: "text.secondary" }}>
      {message()}
    </Typography>
  );
};

export default Text;
