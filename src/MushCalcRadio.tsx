import React, { useState } from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Typography,
  Snackbar,
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
import {
  mushrooms,
  Mushroom,
  RadioEstimate,
  MushroomTry,
  MushroomData,
} from "./types";
import dayjs, { Dayjs } from "dayjs";
import {
  calculateApTimeRange,
  calculateHealthTimeRange,
  calculateStartTime,
  calculateEndTime,
  encodeEvent,
  decodeEvent,
} from "./helpers";
import { useSharedMushroomTries } from "./Provider";

const MushCalcRadio = () => {
  const [derived, setDerived] = useState<RadioEstimate | null>(null);
  const [mush, setMush] = useState<Mushroom | null>(null);
  const [health, setHealth] = useState<number>(1);
  const [pikminAp, setPikminAp] = useState<number>(2);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [startTimeUnix, setStartTimeUnix] = useState<string>("");
  const [endTimeUnix, setEndTimeUnix] = useState<string>("");
  const [valid, setValid] = useState<boolean>(false);
  const [inputEventId, setInputEventId] = useState<string>("");
  const [outputEventId, setOutputEventId] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const { addEvent } = useSharedMushroomTries();

  const recomputeDerived = ({
    mushVal,
    healthVal,
    pikminApVal,
    startTimeVal,
    endTimeVal,
    derivedVal,
  }: {
    mushVal: Mushroom | null;
    healthVal: number;
    pikminApVal: number;
    startTimeVal: Dayjs | null;
    endTimeVal: Dayjs | null;
    derivedVal: RadioEstimate | null;
  }) => {
    let calcHealth = healthVal ?? health;
    let calcAp = pikminApVal ?? pikminAp;
    let calcEnd = endTimeVal ?? endTime;
    let calcStart = startTimeVal ?? startTime;
    let calcMush = mushVal ?? mush;
    if (derivedVal === "ap" && calcStart && calcEnd && calcMush) {
      calcAp = calculateApTimeRange(calcHealth, calcStart, calcEnd);
      setPikminAp(calcAp);
    } else if (
      derivedVal === "health" &&
      calcStart &&
      calcEnd &&
      calcAp &&
      calcMush
    ) {
      calcHealth = calculateHealthTimeRange(calcAp, calcStart, calcEnd);
      setHealth(calcHealth);
    } else if (derivedVal === "startTime" && calcEnd && calcMush && calcAp) {
      calcStart = calculateStartTime(calcHealth, calcAp, calcEnd);
      setStartTime(calcStart);
      setStartTimeUnix(`<t:${calcStart.unix()}:f>`);
    } else if (derivedVal === "endTime" && calcStart && calcMush && calcStart) {
      calcEnd = calculateEndTime(calcHealth, calcAp, calcStart);
      setEndTime(calcEnd);
      setEndTimeUnix(`<t:${calcEnd.unix()}:f>`);
    } else {
      return;
    }
    setValid(true);
    setOutputEventId(
      encodeEvent({
        health: calcHealth,
        pikminAp: calcAp,
        startTime: calcStart,
        endTime: calcEnd,
        mush: calcMush,
      })
    );
  };

  const handleInputEvent = (value: string) => {
    setInputEventId(value);
    const decoded: MushroomData | null = decodeEvent(value);
    if (decoded) {
      const { mush, health, startTime, endTime, pikminAp } = decoded;
      setMush(mush);
      setHealth(health);
      setPikminAp(pikminAp);
      setStartTime(startTime);
      setEndTime(endTime);
      setStartTimeUnix(`<t:${startTime.unix()}:f>`);
      setEndTimeUnix(`<t:${endTime.unix()}:f>`);
    }
  };

  const handleDerivedChange = (value: RadioEstimate | null) => {
    setDerived(value);
    recomputeDerived({
      mushVal: mush,
      healthVal: health,
      pikminApVal: pikminAp,
      startTimeVal: startTime,
      endTimeVal: endTime,
      derivedVal: value,
    });
  };

  const handleHealthChange = (value: number | null) => {
    const newHealth = value ?? 1;
    setHealth(newHealth);
    recomputeDerived({
      mushVal: mush,
      healthVal: newHealth,
      pikminApVal: pikminAp,
      startTimeVal: startTime,
      endTimeVal: endTime,
      derivedVal: derived,
    });
  };

  const handleApChange = (value: number | null) => {
    const newAp = value ?? 2;
    setPikminAp(newAp);
    recomputeDerived({
      mushVal: mush,
      healthVal: health,
      pikminApVal: newAp,
      startTimeVal: startTime,
      endTimeVal: endTime,
      derivedVal: derived,
    });
  };

  const handleMushChange = (mush: Mushroom) => {
    setMush(mush);
    if (mush) {
      setHealth(mush.value);
      recomputeDerived({
        mushVal: mush,
        healthVal: mush.value,
        pikminApVal: pikminAp,
        startTimeVal: startTime,
        endTimeVal: endTime,
        derivedVal: derived,
      });
    } else {
      setHealth(1);
    }
  };

  const handleStartTimeChange = (value: Dayjs | null) => {
    setStartTime(value);
    setStartTimeUnix(`<t:${value?.unix()}:f>`);
    recomputeDerived({
      mushVal: mush,
      healthVal: health,
      pikminApVal: pikminAp,
      startTimeVal: value,
      endTimeVal: endTime,
      derivedVal: derived,
    });
  };

  const handleEndTimeChange = (value: Dayjs | null) => {
    setEndTime(value);
    setEndTimeUnix(`<t:${value?.unix()}:f>`);
    recomputeDerived({
      mushVal: mush,
      healthVal: health,
      pikminApVal: pikminAp,
      startTimeVal: startTime,
      endTimeVal: value,
      derivedVal: derived,
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
    setInputEventId("");
    setOutputEventId("");
  };

  const handleSave = () => {
    addEvent({
      id: crypto.randomUUID(),
      mush: mush as Mushroom,
      health,
      pikminAp,
      startTime: startTime as Dayjs,
      endTime: endTime as Dayjs,
    });
    setSnackbarOpen(true);
  };

  return (
    <Card variant="elevation">
      <CardHeader
        title="Mushroom calculator"
        subheader={
          "after picking a mode, you'll have to fill out the other fields"
        }
        action={
          <Box>
            <TextField
              label="input event ID"
              value={inputEventId}
              onChange={(event) => handleInputEvent(event.target.value)}
              sx={{ minWidth: 246 }}
            />{" "}
            <Button
              startIcon={<RefreshIcon />}
              size="small"
              onClick={handleReset}
            >
              clear
            </Button>
          </Box>
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
              disabled={!mush}
              value={health}
              onValueChange={handleHealthChange}
              isToggled={derived === "health"}
            />
          </Box>
        </Box>
        <Box
          sx={{
            p: 2,
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
          }}
        >
          {startTime && (
            <TextField
              label="discord start time timestamp"
              value={startTimeUnix}
              sx={{ minWidth: 246 }}
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
              sx={{ minWidth: 246 }}
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
          <Typography variant="caption" gutterBottom>
            * All numbers are rounded up
          </Typography>
          <TextField
            label="generated event ID"
            value={outputEventId}
            sx={{ minWidth: 246 }}
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <IconButton
                    onClick={() => navigator.clipboard.writeText(outputEventId)}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                ),
              },
            }}
          />
          <Button variant="contained" disabled={!valid} onClick={handleSave}>
            Save to calendar
          </Button>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={1000}
            onClose={() => setSnackbarOpen(false)}
            message="Result saved"
            action={<></>}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MushCalcRadio;
