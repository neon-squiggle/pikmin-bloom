import React from "react";
import {
  CardContent,
  CardHeader,
  Divider,
  Card,
  TextField,
  Autocomplete,
  Box,
  IconButton,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import NumberSpinner from "./NumberSpinner";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { mushrooms, Mushroom, Estimate } from "./types";
import { message } from "./helpers";
import Footer from "./Footer";
import { useCalculator } from "./useCalculator";

const MushCalcLock = () => {
  const {
    mush,
    health,
    apMin,
    pikminAp,
    timeLeft,
    mode,
    handleMushChange,
    handleApChange,
    handleHealthChange,
    handleModeChange,
    handleTimeChange,
  } = useCalculator();

  const icon = (curr: Estimate) => (
    <IconButton onClick={() => handleModeChange(curr)}>
      {mode === curr ? <LockIcon /> : <LockOpenIcon />}
    </IconButton>
  );

  return (
    <Card variant="elevation">
      <CardHeader title="Mushroom calculator" subheader={message(mode, mush)} />
      <CardContent>
        <Divider />
        <Box
          sx={{
            display: "flex",
            gap: 8,
            p: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Autocomplete
              disablePortal
              // readOnly={mode === "health"}
              disabled={mode === "health"}
              options={mushrooms}
              sx={{
                width: 300,
                mt: 3.5,
              }}
              onChange={(e: any, mush: Mushroom | null) =>
                handleMushChange(mush)
              }
              value={mush}
              renderInput={(params: any) => (
                <TextField {...params} label={`Mushroom Type`} />
              )}
            />
            <NumberSpinner
              label={`Mushroom Health`}
              min={1}
              // readOnly={mode === "health"}
              disabled={mode === "health"}
              value={health}
              onValueChange={handleHealthChange}
            />
          </Box>
          {icon("health")}
        </Box>
        <Box
          sx={{
            p: 2,
            gap: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <NumberSpinner
            label={`Total AP`}
            // readOnly={mode === "ap"}
            disabled={mode === "ap"}
            min={apMin}
            value={pikminAp}
            onValueChange={handleApChange}
          />
          {icon("ap")}
        </Box>
        <Box
          sx={{
            p: 2,
            gap: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <DateTimePicker
            label={`Desired End Time`}
            disablePast
            disabled={mode === "time"}
            // readOnly={mode === "time"}
            value={timeLeft}
            onChange={handleTimeChange}
          />
          {icon("time")}
        </Box>
        {<Footer />}
      </CardContent>
    </Card>
  );
};

export default MushCalcLock;
