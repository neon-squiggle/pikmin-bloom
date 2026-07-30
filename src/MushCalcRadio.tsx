import { useState } from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  CardContent,
  CardHeader,
  Divider,
  Card,
  TextField,
  Autocomplete,
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import NumberSpinner from "./NumberSpinner";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { mushrooms, DerivedField, navbarHeight } from "./types";
import {
  getApForSelectedMushroom,
  NewMushroomFormState,
  recomputeDerived,
} from "./mushroomCalculator";
import ExistingMushroomCalc from "./ExistingMushroomCalc";
import JoinPlanner from "./JoinPlanner";

const initialState: NewMushroomFormState = {
  derived: null,
  mush: null,
  health: 1,
  pikminAp: 2,
  startTime: null,
  endTime: null,
};

const toDiscordTimestamp = (time: NewMushroomFormState["startTime"]) =>
  time ? `<t:${time.unix()}:f>` : "";

const MushCalcRadio = () => {
  const [calculatorMode, setCalculatorMode] = useState<"new" | "existing">(
    "new",
  );
  const [existingFormKey, setExistingFormKey] = useState(0);
  const [form, setForm] = useState<NewMushroomFormState>(initialState);

  const { derived, mush, health, pikminAp, startTime, endTime } = form;

  const clearCalculator = () => {
    if (calculatorMode === "existing") {
      setExistingFormKey((key) => key + 1);
      return;
    }
    setForm(initialState);
  };

  const updateForm = (updates: Partial<NewMushroomFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      return recomputeDerived(next);
    });
  };

  const handleMushChange = (newMush: NewMushroomFormState["mush"]) => {
    if (!newMush) {
      updateForm({ mush: null, health: 1 });
      return;
    }
    updateForm({
      mush: newMush,
      health: newMush.value,
      pikminAp: getApForSelectedMushroom(pikminAp, newMush),
    });
  };

  const hasCompleteBattlePlan = Boolean(
    mush &&
    startTime?.isValid() &&
    endTime?.isValid() &&
    endTime.isAfter(startTime) &&
    Number.isFinite(health) &&
    health > 0 &&
    Number.isFinite(pikminAp) &&
    pikminAp > 0,
  );

  return (
    <Card
      variant="elevation"
      sx={{
        maxHeight: {
          xs: "none",
          md: `calc(100dvh - ${navbarHeight}px)`,
        },
        overflowY: { xs: "visible", md: "auto" },
      }}
    >
      <CardHeader
        title="Mushroom calculator"
        action={
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              size="small"
              onClick={clearCalculator}
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
        <ToggleButtonGroup
          value={calculatorMode}
          exclusive
          fullWidth
          onChange={(_, value) => value && setCalculatorMode(value)}
          aria-label="Mushroom calculator mode"
          sx={{ mb: 3 }}
        >
          <ToggleButton value="new" sx={{ textTransform: "none" }}>
            Plan a new battle
          </ToggleButton>
          <ToggleButton value="existing" sx={{ textTransform: "none" }}>
            Plan a battle in progress
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: calculatorMode === "existing" ? "block" : "none" }}>
          <ExistingMushroomCalc key={existingFormKey} />
        </Box>
        <Box sx={{ display: calculatorMode === "new" ? "block" : "none" }}>
          <FormControl>
            <FormLabel>What should the calculator find?</FormLabel>
            <RadioGroup
              row
              value={derived}
              onChange={(_, value) =>
                updateForm({ derived: value as DerivedField })
              }
            >
              <FormControlLabel
                value="health"
                control={<Radio />}
                label="Starting health"
              />
              <FormControlLabel
                value="ap"
                control={<Radio />}
                label="Starting AP"
              />
              <FormControlLabel
                value="startTime"
                control={<Radio />}
                label="Start time"
              />
              <FormControlLabel
                value="endTime"
                control={<Radio />}
                label="Estimated end time"
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
              options={mushrooms}
              sx={{
                width: { xs: "100%", md: 300 },
                mt: 3.5,
              }}
              onChange={(_, mush) => handleMushChange(mush)}
              value={mush}
              renderInput={(params) => (
                <TextField {...params} label="Mushroom type" />
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
                label="Starting health"
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
              label="Starting AP"
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
                label="Battle start time"
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
                  label="Discord timestamp start time"
                  value={toDiscordTimestamp(startTime)}
                  sx={{ width: "100%" }}
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: (
                        <IconButton
                          onClick={() =>
                            navigator.clipboard.writeText(
                              toDiscordTimestamp(startTime),
                            )
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
                label="Estimated end time"
                readOnly={derived === "endTime"}
                value={endTime}
                onChange={(value) => updateForm({ endTime: value })}
                minDateTime={startTime?.add(1, "minute") ?? undefined}
                slotProps={{
                  textField: {
                    sx: {
                      width: "100%",
                      "& fieldset": {
                        borderColor:
                          derived === "endTime" ? "green" : "primary",
                      },
                    },
                  },
                }}
              />
              {endTime && (
                <TextField
                  label="Discord timestamp end time"
                  value={toDiscordTimestamp(endTime)}
                  sx={{ width: "100%" }}
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: (
                        <IconButton
                          onClick={() =>
                            navigator.clipboard.writeText(
                              toDiscordTimestamp(endTime),
                            )
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
          {hasCompleteBattlePlan && startTime && (
            <JoinPlanner
              variant="planned"
              currentAp={pikminAp}
              healthRemaining={health}
              referenceTime={startTime}
              baselineEndTime={endTime}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MushCalcRadio;
