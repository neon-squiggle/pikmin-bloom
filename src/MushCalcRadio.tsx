import React, { useState } from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
} from "@mui/material";
import {
  CardContent,
  CardHeader,
  Divider,
  Card,
  TextField,
  Autocomplete,
  Box,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import NumberSpinner from "./NumberSpinner";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { mushrooms, Mushroom, RadioEstimate } from "./types";
import Footer from "./Footer";
import { Dayjs } from "dayjs";
import {
  calculateApTimeRange,
  calculateHealthTimeRange,
  calculateStartTime,
  calculateEndTime,
} from "./helpers";

const MushCalcRadio = () => {
  const [derived, setDerived] = useState<RadioEstimate | null>(null);
  const [mush, setMush] = useState<Mushroom | null>(null);
  const [health, setHealth] = useState<number>(1);
  const [pikminAp, setPikminAp] = useState<number>(2);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [startTimeUnix, setStartTimeUnix] = useState<string>("");
  const [endTimeUnix, setEndTimeUnix] = useState<string>("");

  const handleDerivedChange = (value: RadioEstimate | null) => {
    setDerived(value);
  };

  const recomputeDerived = ({
    health,
    pikminAp,
    startTime,
    endTime,
  }: {
    health: number;
    pikminAp: number;
    startTime: Dayjs | null;
    endTime: Dayjs | null;
  }) => {
    if (derived === "ap" && startTime && endTime) {
      setPikminAp(calculateApTimeRange(health, startTime, endTime));
    } else if (derived === "health" && startTime && endTime) {
      setHealth(calculateHealthTimeRange(pikminAp, startTime, endTime));
    } else if (derived === "startTime" && endTime) {
      const start = calculateStartTime(health, pikminAp, endTime);
      setStartTime(start);
      setStartTimeUnix(`<t:${start.unix()}:R>`);
    } else if (derived === "endTime" && startTime) {
      const end = calculateEndTime(health, pikminAp, startTime);
      setEndTime(end);
      setEndTimeUnix(`<t:${end.unix()}:R>`);
    }
  };

  const handleHealthChange = (value: number | null) => {
    const newHealth = value ?? 1;
    setHealth(newHealth);
    recomputeDerived({ health: newHealth, pikminAp, startTime, endTime });
  };

  const handleApChange = (value: number | null) => {
    const newAp = value ?? 2;
    setPikminAp(newAp);
    recomputeDerived({ health, pikminAp: newAp, startTime, endTime });
  };

  const handleMushChange = (mush: Mushroom) => {
    setMush(mush);
    setHealth(mush.value);
    recomputeDerived({
      health: mush.value,
      pikminAp,
      startTime,
      endTime,
    });
  };

  const handleStartTimeChange = (value: Dayjs | null) => {
    setStartTime(value);
    setStartTimeUnix(`<t:${value?.unix()}:R>`);
    recomputeDerived({
      health,
      pikminAp,
      startTime: value,
      endTime,
    });
  };

  const handleEndTimeChange = (value: Dayjs | null) => {
    setEndTime(value);
    setEndTimeUnix(`<t:${value?.unix()}:R>`);
    recomputeDerived({
      health,
      pikminAp,
      startTime,
      endTime: value,
    });
  };

  const handleReset = () => {
    setDerived(null);
    setMush(null);
    setHealth(1);
    setPikminAp(2);
    setStartTime(null);
    setEndTime(null);
    setStartTimeUnix("");
    setEndTimeUnix("");
  };

  return (
    <Card variant="elevation">
      <CardHeader
        title="Mushroom calculator"
        subheader={
          "after picking a mode, you'll have to fill out the other fields"
        }
        action={
          <Button
            startIcon={<RefreshIcon />}
            size="small"
            onClick={handleReset}
          >
            clear
          </Button>
        }
      />
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
            localeText={{ todayButtonLabel: "Now" }}
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
              actionBar: {
                actions: [],
              },
            }}
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
          {startTime && (
            <TextField
              label="discord start time timestamp"
              value={startTimeUnix}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        navigator.clipboard.writeText(startTimeUnix)
                      }
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  ),
                },
              }}
            />
          )}
          {endTime && (
            <TextField
              label="discord end time timestamp"
              value={endTimeUnix}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <IconButton
                      onClick={() => navigator.clipboard.writeText(endTimeUnix)}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  ),
                },
              }}
            />
          )}
        </Box>
        {<Footer />}
      </CardContent>
    </Card>
  );
};

export default MushCalcRadio;
