import { useId, useState } from "react";
import { Alert, Autocomplete, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import SectionAccordion from "./SectionAccordion";
import WallClockProvider from "./WallClockProvider";
import { parsePlannerState, PlannerFinish, PlannerState } from "./stagePlanner";
import NumberSpinner from "./NumberSpinner";
import { pairedFieldGridSx } from "./formStyles";
import FilePickerButton from "./FilePickerButton";
import EventProgressSettings from "./EventProgressSettings";
import PlannerTimeField from "./PlannerTimeField";

const PlannerSettings = ({
  state, month, onChange, onImport, storageError = false, onRetry,
}: {
  state: PlannerState;
  month: string;
  onChange: (changes: Partial<PlannerState>) => void;
  onImport: (finishes: PlannerFinish[]) => void;
  storageError?: boolean;
  onRetry?: () => void;
}) => {
  const [error, setError] = useState("");
  const timingHelpId = useId();
  const timingTitleId = useId();
  const zones = (
    Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] }
  ).supportedValuesOf?.("timeZone") ?? ["UTC", "America/Los_Angeles", "Europe/London", "Asia/Tokyo"];
  const exportPlan = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "mushroom-plan.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <SectionAccordion title="Settings">
      <Stack spacing={3} divider={<Divider />}>
        <Stack role="group" aria-label="Plan" spacing={2.5}>
          <Typography component="h3" variant="subtitle2">Plan</Typography>
          <Stack direction="row" gap={1} alignItems="center">
            <WallClockProvider>
              <DatePicker
                label="Month"
                views={["year", "month"]}
                value={dayjs.utc(`${month}-01`)}
                onChange={(value) => {
                  if (value?.isValid()) onChange({ selectedMonth: value.format("YYYY-MM") });
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </WallClockProvider>
            {state.selectedMonth && <Button color="inherit" onClick={() => onChange({ selectedMonth: undefined })}>Auto</Button>}
          </Stack>
          <EventProgressSettings
            key={month}
            progress={state.eventProgress[month]}
            onChange={(value) => {
              const eventProgress = { ...state.eventProgress };
              if (value) eventProgress[month] = value;
              else delete eventProgress[month];
              onChange({ eventProgress });
            }}
          />
        </Stack>
        <Stack role="group" aria-labelledby={timingTitleId} aria-describedby={timingHelpId} spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography component="h3" variant="subtitle2" id={timingTitleId}>Timing warnings</Typography>
            <Typography variant="body2" color="text.secondary" id={timingHelpId}>
              Flags mushrooms that may end before you can claim the previous task’s reward and reach the next mushroom task. Checks sleep hours and the minimum time between tasks separately.
            </Typography>
          </Stack>
          <Stack sx={pairedFieldGridSx}>
            <PlannerTimeField label="Sleep from" value={state.sleepStart} onChange={(sleepStart) => onChange({ sleepStart })} descriptionId={timingHelpId} />
            <PlannerTimeField label="Sleep until" value={state.sleepEnd} onChange={(sleepEnd) => onChange({ sleepEnd })} descriptionId={timingHelpId} />
          </Stack>
          <NumberSpinner
            label="Minimum time between tasks"
            unit="min"
            min={0}
            allowDecimal={false}
            value={state.minimumGapMinutes || null}
            onValueChange={(value) => onChange({ minimumGapMinutes: value != null && Number.isFinite(value) ? value : 0 })}
          />
        </Stack>
        <Stack role="group" aria-label="Device and backup" spacing={2.5}>
          <Typography component="h3" variant="subtitle2">Device &amp; backup</Typography>
          {storageError && (
            <Alert severity="error" action={onRetry ? <Button color="inherit" onClick={onRetry}>Retry save</Button> : undefined}>
              Changes could not be saved on this device. Export your plan to keep a backup.
            </Alert>
          )}
          <Autocomplete
            options={Array.from(new Set([state.timezone, ...zones]))}
            value={state.timezone}
            disableClearable
            onChange={(_, timezone) => onChange({ timezone })}
            renderInput={(params) => <TextField {...params} label="Timezone" />}
          />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button variant="outlined" onClick={exportPlan}>Export plan</Button>
            <FilePickerButton
              variant="outlined"
              inputLabel="Import plan"
              accept="application/json,.json"
              onFiles={async (files) => {
                const file = files[0];
                if (!file) return;
                try {
                  const plan = parsePlannerState(JSON.parse(await file.text()), state.timezone);
                  if (!plan) throw new Error("Choose a valid plan file.");
                  setError("");
                  onImport(plan.finishes);
                } catch {
                  setError("Choose a valid plan file.");
                }
              }}
            >Import plan</FilePickerButton>
          </Stack>
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </SectionAccordion>
  );
};
export default PlannerSettings;
