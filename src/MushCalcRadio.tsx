import { useState } from "react";
import dayjs from "dayjs";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import DiscordTimestampField from "./DiscordTimestampField";
import ExistingMushroomCalc from "./ExistingMushroomCalc";
import JoinPlanner from "./JoinPlanner";
import NumberSpinner from "./NumberSpinner";
import SimpleDateTimeInput from "./SimpleDateTimeInput";
import {
  getApForSelectedMushroom,
  NewMushroomFormState,
  recomputeDerived,
} from "./mushroomCalculator";
import { DerivedField, mushrooms, navbarHeight } from "./types";

const getInitialState = (): NewMushroomFormState => ({
  derived: "endTime",
  mush: null,
  health: Number.NaN,
  pikminAp: 2,
  startTime: dayjs().second(0).millisecond(0),
  endTime: null,
});

const MushCalcRadio = () => {
  const [calculatorMode, setCalculatorMode] = useState<"new" | "existing">(
    "new",
  );
  const [existingFormKey, setExistingFormKey] = useState(0);
  const [form, setForm] = useState<NewMushroomFormState>(() =>
    getInitialState(),
  );

  const { derived, mush, health, pikminAp, startTime, endTime } = form;

  const clearCalculator = () => {
    if (calculatorMode === "existing") {
      setExistingFormKey((key) => key + 1);
      return;
    }
    setForm(getInitialState());
  };

  const updateForm = (updates: Partial<NewMushroomFormState>) => {
    setForm((previous) => recomputeDerived({ ...previous, ...updates }));
  };

  const handleMushChange = (newMush: NewMushroomFormState["mush"]) => {
    if (!newMush) {
      updateForm({ mush: null, health: Number.NaN });
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
        maxHeight: { xs: "none", md: `calc(100dvh - ${navbarHeight}px)` },
        overflowY: { xs: "visible", md: "auto" },
      }}
    >
      <CardHeader
        title="Mushroom calculator"
        action={
          <Button
            startIcon={<RefreshIcon />}
            size="small"
            onClick={clearCalculator}
          >
            Clear
          </Button>
        }
      />
      <CardContent>
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

        {calculatorMode === "existing" ? (
          <ExistingMushroomCalc key={existingFormKey} />
        ) : (
          <Stack spacing={3}>
            <FormControl>
              <FormLabel>What do you want to calculate?</FormLabel>
              <RadioGroup
                row
                value={derived}
                onChange={(_, value) =>
                  updateForm({ derived: value as DerivedField })
                }
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(4, minmax(0, 1fr))",
                  },
                  columnGap: 1,
                }}
              >
                <FormControlLabel
                  value="health"
                  control={<Radio />}
                  label="Health"
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  value="ap"
                  control={<Radio />}
                  label="AP"
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  value="startTime"
                  control={<Radio />}
                  label="Start time"
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  value="endTime"
                  control={<Radio />}
                  label="End time"
                  sx={{ m: 0 }}
                />
              </RadioGroup>
            </FormControl>

            <Divider />

            <Autocomplete
              disablePortal
              options={mushrooms}
              value={mush}
              onChange={(_, newMush) => handleMushChange(newMush)}
              renderInput={(params) => (
                <TextField {...params} label="Mushroom type" />
              )}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <NumberSpinner
                label="Health"
                min={1}
                value={health}
                readOnly={derived === "health"}
                showStepper={false}
                allowDecimal={false}
                isToggled={derived === "health"}
                onValueChange={(value) =>
                  updateForm({ health: value ?? Number.NaN })
                }
              />
              <NumberSpinner
                label="AP"
                min={2}
                value={pikminAp}
                readOnly={derived === "ap"}
                showStepper={false}
                allowDecimal={false}
                isToggled={derived === "ap"}
                unit="AP"
                onValueChange={(value) =>
                  updateForm({ pikminAp: value ?? Number.NaN })
                }
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Stack spacing={1.5}>
                <SimpleDateTimeInput
                  label="Battle start time"
                  readOnly={derived === "startTime"}
                  isToggled={derived === "startTime"}
                  showNowAction
                  value={startTime}
                  onChange={(value) => updateForm({ startTime: value })}
                />
                <DiscordTimestampField
                  label="Start time Discord timestamp"
                  time={startTime}
                />
              </Stack>

              <Stack spacing={1.5}>
                <SimpleDateTimeInput
                  label="End time"
                  readOnly={derived === "endTime"}
                  isToggled={derived === "endTime"}
                  value={endTime}
                  onChange={(value) => updateForm({ endTime: value })}
                  minDateTime={startTime?.add(1, "minute") ?? undefined}
                />
                <DiscordTimestampField
                  label="End time Discord timestamp"
                  time={endTime}
                />
              </Stack>
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
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default MushCalcRadio;
