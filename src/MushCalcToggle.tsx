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
import Toggle from "./Toggle";
import Footer from "./Footer";
import { useCalculator } from "./useCalculator";

const MushCalcToggle = () => {
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

  return (
    <Card variant="elevation">
      <CardHeader
        title="Mushroom calculator"
        subheader={message(mode, mush)}
        action={
          <Toggle
            mode={mode}
            handleModeChange={(e: React.MouseEvent, value: Estimate) =>
              handleModeChange(value)
            }
          />
        }
      />
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
              readOnly={mode === "health"}
              options={mushrooms}
              sx={{
                width: 300,
                mt: 3.5,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: mode === "health" ? "green" : "primary",
                  },
                },
              }}
              onChange={(e: any, mush: Mushroom | null) =>
                handleMushChange(mush)
              }
              value={mush}
              renderInput={(params: any) => (
                <TextField
                  {...params}
                  label={`Mushroom Type ${mode === "health" ? "(locked)" : ""}`}
                />
              )}
            />
            <NumberSpinner
              label={`Mushroom Health ${mode === "health" ? "(locked)" : ""}`}
              min={1}
              readOnly={mode === "health"}
              value={health}
              onValueChange={handleHealthChange}
              isToggled={mode === "health"}
            />
          </Box>
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
            label={`Total AP ${mode === "ap" ? "(locked)" : ""}`}
            readOnly={mode === "ap"}
            min={apMin}
            value={pikminAp}
            onValueChange={handleApChange}
            isToggled={mode === "ap"}
          />
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
            label={`Desired End Time ${mode === "time" ? "(locked)" : ""}`}
            readOnly={mode === "time"}
            value={timeLeft}
            onChange={handleTimeChange}
            slotProps={{
              textField: {
                sx: {
                  "& fieldset": {
                    borderColor: mode === "time" ? "green" : "primary",
                  },
                },
              },
            }}
          />
        </Box>
        {<Footer />}
      </CardContent>
    </Card>
  );
};

export default MushCalcToggle;
