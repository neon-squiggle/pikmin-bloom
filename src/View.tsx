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
        {mode === "calendar" && (
          <Stack
            direction="column"
            divider={<Divider orientation="horizontal" flexItem />}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              mt: 1,
            }}
          >
            {mushStages.map((stage) => (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  {stage.stage}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {stage.tries}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
      <Box sx={{ width: 800, minHeight: 1000 }}>
        {mode === "calculator" && <MushCalcRadio />}
        {mode === "calendar" && <Timeline />}
      </Box>
    </Box>
  );
};

export default View;
