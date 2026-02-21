import { useState } from "react";
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
  DerivedField,
  navbarHeight,
} from "./types";
import { Dayjs } from "dayjs";
import {
  calculateApTimeRange,
  calculateHealthTimeRange,
  calculateStartTime,
  calculateEndTime,
} from "./helpers";
import { useSharedMushroomTries } from "./Provider";

interface FormState {
  derived: DerivedField | null;
  mush: Mushroom | null;
  health: number;
  pikminAp: number;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
}

const initialState: FormState = {
  derived: null,
  mush: null,
  health: 1,
  pikminAp: 2,
  startTime: null,
  endTime: null,
};

const toDiscordTimestamp = (time: Dayjs | null) =>
  time ? `<t:${time.unix()}:f>` : "";

const MushCalcRadio = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { addEvent } = useSharedMushroomTries();

  const { derived, mush, health, pikminAp, startTime, endTime } = form;

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      return recomputeDerived(next);
    });
  };

  const recomputeDerived = (state: FormState): FormState => {
    const { derived, mush, health, pikminAp, startTime, endTime } = state;

    if (!mush) return state;

    if (derived === "ap" && startTime && endTime) {
      return { ...state, pikminAp: calculateApTimeRange(health, startTime, endTime) };
    }
    if (derived === "health" && startTime && endTime && pikminAp) {
      return { ...state, health: calculateHealthTimeRange(pikminAp, startTime, endTime) };
    }
    if (derived === "startTime" && endTime && pikminAp) {
      return { ...state, startTime: calculateStartTime(health, pikminAp, endTime) };
    }
    if (derived === "endTime" && startTime && pikminAp) {
      return { ...state, endTime: calculateEndTime(health, pikminAp, startTime) };
    }
    return state;
  };

  const handleMushChange = (newMush: Mushroom | null) => {
    if (!newMush) {
      updateForm({ mush: null, health: 1 });
      return;
    }
    const minAp = mushrooms.find((m) => m.label === newMush.label)?.minimum ?? 2;
    updateForm({
      mush: newMush,
      health: newMush.value,
      pikminAp: pikminAp !== 2 ? pikminAp : minAp,
    });
  };

  const isValid = mush && startTime && endTime && health > 0 && pikminAp > 0;

  const handleSave = () => {
    if (!isValid) return;
    addEvent({
      id: crypto.randomUUID(),
      mush,
      health,
      pikminAp,
      startTime,
      endTime,
    });
    setSnackbarOpen(true);
  };

  return (
    <Card
      variant="elevation"
      sx={{ maxHeight: `calc(100dvh - ${navbarHeight}px)`, overflowY: "auto" }}
    >
      <CardHeader
        title="Mushroom calculator"
        action={
          <Box>
            {/* <TextField
              label="input event ID"
              value={inputEventId}
              onChange={(event) => handleInputEvent(event.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 246 } }}
            /> */}
            <Button
              startIcon={<RefreshIcon />}
              size="small"
              onClick={() => setForm(initialState)}
            >
              clear
            </Button>
          </Box>
        }
      />
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <FormControl>
          <FormLabel>I want to calculate: </FormLabel>
          <RadioGroup
            row
            value={derived}
            onChange={(_, value) => updateForm({ derived: value as DerivedField })}
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
            gap: { xs: 2, md: 4 },
            p: 2,
            alignItems: "center",
            justifyContent: "flex-start",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Autocomplete
            disablePortal
            readOnly={derived === "health"}
            options={mushrooms}
            sx={{
              width: { xs: "100%", md: 300 },
              mt: 3.5,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: derived === "health" ? "green" : "primary",
                },
              },
            }}
            onChange={(_, mush) => handleMushChange(mush)}
            value={mush}
            renderInput={(params: any) => (
              <TextField {...params} label={`Mushroom Type`} />
            )}
          />
          <Box
            sx={{
              width: { xs: "100%", md: "auto" },
              display: "flex",
              alignItems: { xs: "flex-start", md: "center" },
            }}
          >
            <NumberSpinner
              label={`Mushroom Health`}
              min={1}
              readOnly={derived === "health"}
              disabled={!mush}
              value={health}
              onValueChange={(v) => updateForm({ health: v ?? 1 })}
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
            onValueChange={(v) => updateForm({ pikminAp: v ?? 2 })}
            isToggled={derived === "ap"}
          />
        </Box>
        <Box
          sx={{
            p: 2,
            display: "flex",
            gap: { xs: 2, sm: 4 },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: { xs: "100%", sm: 246 },
            }}
          >
            <DateTimePicker
              label={`Desired Start Time`}
              readOnly={derived === "startTime"}
              value={startTime}
              onChange={(value) => updateForm({ startTime: value })}
              localeText={{ todayButtonLabel: "Now" }}
              slotProps={{
                textField: {
                  sx: {
                    width: "100%",
                    "& fieldset": {
                      borderColor:
                        derived === "startTime" ? "green" : "primary",
                    },
                  },
                },
                actionBar: { actions: ["today"] },
              }}
            />
            {startTime && (
              <TextField
                label="discord start time timestamp"
                value={toDiscordTimestamp(startTime)}
                sx={{ width: "100%" }}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <IconButton
                        onClick={() =>
                          navigator.clipboard.writeText(toDiscordTimestamp(startTime))
                        }
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    ),
                  },
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: { xs: "100%", sm: 246 },
            }}
          >
            <DateTimePicker
              label={`Desired End Time`}
              readOnly={derived === "endTime"}
              value={endTime}
              onChange={(value) => updateForm({ endTime: value })}
              minDateTime={startTime?.add(1, "minute") ?? undefined}
              slotProps={{
                textField: {
                  sx: {
                    width: "100%",
                    "& fieldset": {
                      borderColor: derived === "endTime" ? "green" : "primary",
                    },
                  },
                },
              }}
            />
            {endTime && (
              <TextField
                label="discord end time timestamp"
                value={toDiscordTimestamp(endTime)}
                sx={{ width: "100%" }}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <IconButton
                        onClick={() =>
                          navigator.clipboard.writeText(toDiscordTimestamp(endTime))
                        }
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    ),
                  },
                }}
              />
            )}
          </Box>
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            gap: { xs: 2, md: 4 },
            p: 2,
            alignItems: "center",
            justifyContent: "flex-end",
            mt: "auto",
          }}
        >
          {/* generated output ID removed for responsive layout; reinstate with fullWidth if needed */}
          <Button variant="contained" disabled={!isValid} onClick={handleSave}>
            Save to calendar
          </Button>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={1000}
            onClose={() => setSnackbarOpen(false)}
            message="Result saved"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MushCalcRadio;
