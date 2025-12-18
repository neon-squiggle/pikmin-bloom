import React, { useState } from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import {
  CardContent,
  CardHeader,
  Divider,
  Card,
  TextField,
  Autocomplete,
  Box,
} from "@mui/material";
import NumberSpinner from "./NumberSpinner";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { mushrooms, Mushroom, RadioEstimate } from "./types";
import Footer from "./Footer";
import dayjs, { Dayjs } from "dayjs";
import {
  calculateAp,
  calculateHealth,
  calculateStartTime,
  calculateEndTime,
} from "./helpers";

const MushCalcRadio = () => {
  const [derived, setDerived] = useState<RadioEstimate | null>(null);
  const [mush, setMush] = useState<Mushroom | null>(null);
  const [health, setHealth] = useState<number>(1);
  const [pikminAp, setPikminAp] = useState<number>(2);
  const [startTime, setStartTime] = useState<Dayjs | null>();
  const [endTime, setEndTime] = useState<Dayjs | null>(null);

  const handleDerivedChange = (value: RadioEstimate | null) => {
    setDerived(value);
  };

  const handleMushChange = (mush: Mushroom) => {
    setMush(mush);
    setHealth(mush.value);
    if (derived === "ap" && startTime && endTime) {
      setPikminAp(calculateAp(mush.value, endTime, startTime));
    } else if (derived === "startTime" && endTime) {
      setStartTime(calculateStartTime(mush.value, pikminAp, endTime));
    } else if (derived === "endTime" && startTime) {
      setEndTime(calculateEndTime(mush.value, pikminAp, startTime));
    }
  };

  const handleHealthChange = (value: number | null) => {
    const newHealth = value ?? 1;
    setHealth(newHealth);
    if (derived === "ap" && startTime && endTime) {
      setPikminAp(calculateAp(newHealth, endTime, startTime));
    } else if (derived === "startTime" && endTime) {
      setStartTime(calculateStartTime(newHealth, pikminAp, endTime));
    } else if (derived === "endTime" && startTime) {
      setEndTime(calculateEndTime(newHealth, pikminAp, startTime));
    }
  };

  const handleApChange = (value: number | null) => {
    const newAp = value ?? 2;
    setPikminAp(newAp);
    if (derived === "health" && startTime && endTime) {
      setHealth(calculateHealth(newAp, endTime, startTime));
    } else if (derived === "startTime" && endTime) {
      setStartTime(calculateStartTime(health, newAp, endTime));
    } else if (derived === "endTime" && startTime) {
      setEndTime(calculateEndTime(health, newAp, startTime));
    }
  };

  const handleStartTimeChange = (value: Dayjs | null) => {
    setStartTime(value);
  };

  const handleEndTimeChange = (value: Dayjs | null) => {
    setEndTime(value);
  };

  return (
    <Card variant="elevation">
      <CardHeader title="Mushroom calculator" subheader={""} />
      <CardContent>
        <FormControl>
          <FormLabel>I want to calculate: </FormLabel>
          <RadioGroup
            row
            value={derived}
            onChange={(e: React.ChangeEvent, value: string) =>
              handleDerivedChange(value as RadioEstimate)
            }
          >
            <FormControlLabel
              value="health"
              control={<Radio />}
              label="mushroom health"
            />
            <FormControlLabel value="ap" control={<Radio />} label="total AP" />
            <FormControlLabel
              value="startTime"
              control={<Radio />}
              label="start time"
            />
            <FormControlLabel
              value="endTime"
              control={<Radio />}
              label="end time"
            />
          </RadioGroup>
        </FormControl>
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
              readOnly={derived === "health"}
              options={mushrooms}
              sx={{
                width: 300,
                mt: 3.5,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: derived === "health" ? "green" : "primary",
                  },
                },
              }}
              onChange={(e: any, mush: Mushroom | null) =>
                handleMushChange(mush!)
              }
              value={mush}
              renderInput={(params: any) => (
                <TextField {...params} label={`Mushroom Type`} />
              )}
            />
            <NumberSpinner
              label={`Mushroom Health`}
              min={1}
              readOnly={derived === "health"}
              value={health}
              onValueChange={handleHealthChange}
              isToggled={derived === "health"}
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
            label={`Total AP`}
            readOnly={derived === "ap"}
            min={2}
            value={pikminAp}
            onValueChange={handleApChange}
            isToggled={derived === "ap"}
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
            label={`Desired Start Time`}
            readOnly={derived === "startTime"}
            value={startTime}
            onChange={(value) => handleStartTimeChange(value)}
            slotProps={{
              textField: {
                sx: {
                  "& fieldset": {
                    borderColor: derived === "startTime" ? "green" : "primary",
                  },
                },
              },
              actionBar: {
                actions: ["today"],
              },
            }}
          />
          <DateTimePicker
            label={`Desired End Time`}
            readOnly={derived === "endTime"}
            value={endTime}
            onChange={handleEndTimeChange}
            minDateTime={startTime ?? undefined}
            slotProps={{
              textField: {
                sx: {
                  "& fieldset": {
                    borderColor: derived === "endTime" ? "green" : "primary",
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

export default MushCalcRadio;
