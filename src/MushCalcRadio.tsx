import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import {
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  calculatorFormForFinish,
  finishFromCalculator,
  PlannerCalculationRequest,
} from "./plannerCalculator";
import { PlannerFinish } from "./stagePlanner";
import DiscordTimestampField from "./DiscordTimestampField";
import ExistingMushroomCalc from "./ExistingMushroomCalc";
import JoinPlanner from "./JoinPlanner";
import NumberSpinner from "./NumberSpinner";
import SimpleDateTimeInput from "./SimpleDateTimeInput";
import MushroomTypeField from "./MushroomTypeField";
import { pairedFieldGridSx } from "./formStyles";
import {
  getApForSelectedMushroom,
  NewMushroomFormState,
  recomputeDerived,
} from "./mushroomCalculator";
import { DerivedField, navbarHeight } from "./types";

const getInitialState = (): NewMushroomFormState => ({
  derived: "endTime",
  mush: null,
  health: Number.NaN,
  pikminAp: 2,
  startTime: dayjs().second(0).millisecond(0),
  endTime: null,
});

const MushCalcRadio = ({
  planningRequest,
  onUsePlan,
  onCancelPlan,
  embedded = false,
}: {
  embedded?: boolean;
  planningRequest?: PlannerCalculationRequest | null;
  onUsePlan?: (finish: PlannerFinish) => void;
  onCancelPlan?: () => void;
}) => {
  const [calculatorMode, setCalculatorMode] = useState<"new" | "existing">(
    "new",
  );
  const [newFormKey, setNewFormKey] = useState(0);
  const [existingFormKey, setExistingFormKey] = useState(0);
  const [hasOpenedExisting, setHasOpenedExisting] = useState(false);
  const [form, setForm] = useState<NewMushroomFormState>(() =>
    getInitialState(),
  );

  const originalDraft = useRef<{
    form: NewMushroomFormState;
    mode: "new" | "existing";
  } | null>(null);
  useEffect(() => {
    if (planningRequest) {
      setForm((previous) => {
        if (!originalDraft.current)
          originalDraft.current = { form: previous, mode: calculatorMode };
        return calculatorFormForFinish(planningRequest.finish);
      });
      setCalculatorMode("new");
    } else if (originalDraft.current) {
      setForm(originalDraft.current.form);
      setCalculatorMode(originalDraft.current.mode);
      originalDraft.current = null;
    }
    // The request is an explicit handoff, independent of subsequent form edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planningRequest]);

  const { derived, mush, health, pikminAp, startTime, endTime } = form;

  const clearCalculator = () => {
    if (calculatorMode === "existing") {
      setExistingFormKey((key) => key + 1);
      return;
    }
    setNewFormKey((key) => key + 1);
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
      elevation={embedded ? 0 : 1}
      sx={{
        ...(embedded && {
          borderRadius: 0,
          bgcolor: "transparent",
          backgroundImage: "none",
        }),
        maxHeight: { xs: "none", md: `calc(100dvh - ${navbarHeight + 64}px)` },
        overflowY: { xs: "visible", md: "auto" },
      }}
    >
      <CardHeader
        slotProps={{ title: { component: "h1" } }}
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
        {planningRequest && (
          <Box component="section" aria-label="Planner calculation" sx={{ mb: 2, p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Typography variant="body2">{planningRequest.finish.title}</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
              <Button
                disabled={!hasCompleteBattlePlan || calculatorMode !== "new"}
                onClick={() => {
                  const finish = finishFromCalculator(
                    planningRequest.finish,
                    form,
                  );
                  if (finish) onUsePlan?.(finish);
                }}
              >
                Use in planner
              </Button>
              <Button color="inherit" onClick={onCancelPlan}>
                Cancel start-time plan
              </Button>
            </Stack>
          </Box>
        )}
        <ToggleButtonGroup
          value={calculatorMode}
          exclusive
          fullWidth
          onChange={(_, value) => {
            if (!value) return;
            if (value === "existing") setHasOpenedExisting(true);
            setCalculatorMode(value);
          }}
          aria-label="Mushroom calculator mode"
          sx={{ mb: 3, "& .MuiToggleButton-root": { minHeight: 48, px: 1 } }}
        >
          <ToggleButton value="new" aria-label="Plan a new battle">
            New battle
          </ToggleButton>
          <ToggleButton value="existing" aria-label="Plan a battle in progress">
            In progress
          </ToggleButton>
        </ToggleButtonGroup>

        {hasOpenedExisting && (
          <Box hidden={calculatorMode !== "existing"}>
            <ExistingMushroomCalc key={existingFormKey} />
          </Box>
        )}
        <Box key={newFormKey} hidden={calculatorMode !== "new"}>
          <Stack spacing={3}>
            <FormControl>
              <FormLabel id="calculate-label">Calculate</FormLabel>
              <RadioGroup
                row
                aria-labelledby="calculate-label"
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
                  rowGap: 0.5,
                  "& .MuiFormControlLabel-root": {
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
              >
                <FormControlLabel
                  value="health"
                  control={<Radio />}
                  label="Health"
                  sx={{
                    m: 0,
                    bgcolor:
                      derived === "health" ? "action.selected" : undefined,
                  }}
                />
                <FormControlLabel
                  value="ap"
                  control={<Radio />}
                  label="AP"
                  sx={{
                    m: 0,
                    bgcolor: derived === "ap" ? "action.selected" : undefined,
                  }}
                />
                <FormControlLabel
                  value="startTime"
                  control={<Radio />}
                  label="Start time"
                  sx={{
                    m: 0,
                    bgcolor:
                      derived === "startTime" ? "action.selected" : undefined,
                  }}
                />
                <FormControlLabel
                  value="endTime"
                  control={<Radio />}
                  label="End time"
                  sx={{
                    m: 0,
                    bgcolor:
                      derived === "endTime" ? "action.selected" : undefined,
                  }}
                />
              </RadioGroup>
            </FormControl>

            <Divider />

            <MushroomTypeField
              variant="preset"
              value={mush}
              onChange={handleMushChange}
            />

            <Box sx={pairedFieldGridSx}>
              <NumberSpinner
                label="Health"
                min={1}
                value={health}
                readOnly={derived === "health"}
                allowDecimal={false}
                onValueChange={(value) =>
                  updateForm({ health: value ?? Number.NaN })
                }
              />
              <NumberSpinner
                label="AP"
                min={2}
                value={pikminAp}
                readOnly={derived === "ap"}
                allowDecimal={false}
                unit="AP"
                onValueChange={(value) =>
                  updateForm({ pikminAp: value ?? Number.NaN })
                }
              />
            </Box>

            <Box sx={pairedFieldGridSx}>
              <DiscordTimestampField label="Start time Discord timestamp" time={startTime}>
                <SimpleDateTimeInput
                  label="Battle start time"
                  readOnly={derived === "startTime"}
                  showNowAction
                  value={startTime}
                  onChange={(value) => updateForm({ startTime: value })}
                />
              </DiscordTimestampField>

              <DiscordTimestampField label="End time Discord timestamp" time={endTime}>
                <SimpleDateTimeInput
                  label="End time"
                  readOnly={derived === "endTime"}
                  value={endTime}
                  onChange={(value) => updateForm({ endTime: value })}
                  minDateTime={startTime?.add(1, "minute") ?? undefined}
                />
              </DiscordTimestampField>
            </Box>

            <JoinPlanner
              variant="planned"
              currentAp={pikminAp}
              healthRemaining={health}
              referenceTime={startTime?.isValid() ? startTime : dayjs()}
              baselineEndTime={hasCompleteBattlePlan ? endTime : null}
            />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MushCalcRadio;
