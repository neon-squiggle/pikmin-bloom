import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ResponsiveDialog from "./ResponsiveDialog";
import { formatPlannerDateTime } from "./plannerDateTime";
import {
  isPlannedMushroom,
  localDateTime,
  PlannerFinish,
  selectedFinishTime,
} from "./stagePlanner";
import { defaultPlannedEnd, tryStartDay, validTryDate } from "./hypotheticalTries";
import { TimeRemainingInput } from "./types";
import { durationToSeconds, parseTimeRemaining } from "./helpers";
import MushroomTypeField from "./MushroomTypeField";
import PlannerFinishField from "./PlannerFinishField";
import CountdownFields from "./CountdownFields";
import PlannerTryDateField from "./PlannerTryDateField";
import PlannedTryFields, {
  PlannedTryInput,
  plannedTryTime,
} from "./PlannedTryFields";

const PlannerFinishEditor = ({
  finish,
  timezone,
  onSave,
  onRemove,
  onClose,
  isNew = false,
  types,
  onCalculate,
  eventMonth,
}: {
  onCalculate?: (finish: PlannerFinish) => void;
  isNew?: boolean;
  types: string[];
  eventMonth?: string;
  finish: PlannerFinish;
  timezone: string;
  onSave: (finish: PlannerFinish) => void;
  onRemove: (finish: PlannerFinish) => void;
  onClose: () => void;
}) => {
  const [planned, setPlanned] = useState(() => isPlannedMushroom(finish));
  const useCountdown = isNew && !planned;
  const [countdownTouched, setCountdownTouched] = useState(false);
  const [remaining, setRemaining] = useState<TimeRemainingInput>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [missed, setMissed] = useState(finish.missed === true);
  const [titleTouched, setTitleTouched] = useState(false);
  const [input, setInput] = useState<PlannedTryInput>(() => ({
    title: finish.title,
    type: finish.type,
    extraTry: finish.usesFreeTry === false,
    tryDay:
      tryStartDay(finish, timezone) ??
      (isNew ? localDateTime(Date.now(), timezone).slice(0, 10) : ""),
    wallTime:
      isNew && finish.source === "manual"
        ? defaultPlannedEnd(
            Date.now(),
            timezone,
            eventMonth ?? localDateTime(Date.now(), timezone).slice(0, 7),
          )
        : localDateTime(Date.parse(finish.endAt), timezone),
    occurrence:
      isNew && finish.source === "manual"
        ? ""
        : String(Date.parse(finish.endAt)),
  }));
  const changeInput = (changes: Partial<PlannedTryInput>) =>
    setInput((previous) => ({ ...previous, ...changes }));
  const duration = parseTimeRemaining({
    days: remaining.days ?? 0,
    hours: remaining.hours ?? 0,
    minutes: remaining.minutes ?? 0,
    seconds: remaining.seconds ?? 0,
  });
  const countdownEnd = () =>
    duration ? Date.now() + durationToSeconds(duration) * 1000 : null;
  const instant = useCountdown
    ? countdownEnd()
    : planned
      ? plannedTryTime(input, timezone)
      : selectedFinishTime(input.wallTime, timezone, input.occurrence);
  const trackStartDate = planned || finish.source === "screenshot";
  const latestStartDate = instant != null
    ? [
        localDateTime(instant, timezone).slice(0, 10),
        ...(!planned && finish.capturedAt
          ? [localDateTime(Date.parse(finish.capturedAt), timezone).slice(0, 10)]
          : []),
      ].sort()[0]
    : undefined;
  const invalid =
    instant == null ||
    (trackStartDate && (!validTryDate(input.tryDay) || Boolean(input.tryDay && latestStartDate && input.tryDay > latestStartDate))) ||
    (!planned && (!input.title.trim() || !input.type.trim()));
  const sameType = input.type.trim() === finish.type.trim();
  const retainsStart =
    planned &&
    sameType &&
    instant === Date.parse(finish.endAt) &&
    input.tryDay === (tryStartDay(finish, timezone) ?? "");
  const draft = (): PlannerFinish => ({
    ...finish,
    title: input.title.trim() || "Daily mushroom",
    type: input.type.trim(),
    source: isNew ? (planned ? "hypothetical" : "manual") : finish.source,
    endAt: new Date(useCountdown ? countdownEnd()! : instant!).toISOString(),
    missed,
    usesFreeTry: !input.extraTry,
    status: planned ? "planned" : "running",
    tryDay: trackStartDate ? input.tryDay || undefined : undefined,
    startAt: retainsStart ? finish.startAt : undefined,
    plannedAp: planned && sameType ? finish.plannedAp : undefined,
    plannedHealth: planned && sameType ? finish.plannedHealth : undefined,
  });
  return (
    <ResponsiveDialog
      open
      onClose={onClose}
      title={isNew ? "Add mushroom" : "Edit mushroom"}
      titleId="finish-editor-title"
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalid) onSave(draft());
      }}
      actions={
        <>
          {!isNew && (
            <Button
              color="error"
              onClick={() => onRemove(finish)}
              sx={{ mr: "auto" }}
            >
              Remove
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={invalid}>
            {isNew ? "Add mushroom" : "Save"}
          </Button>
        </>
      }
    >
      {isNew && (
        <Tabs
          value={planned ? "planned" : "running"}
          onChange={(_, value) => setPlanned(value === "planned")}
          aria-label="Mushroom entry"
          sx={{ mb: 2 }}
        >
          <Tab
            id="entry-running-tab"
            aria-controls="entry-running"
            value="running"
            label="In progress"
          />
          <Tab
            id="entry-planned-tab"
            aria-controls="entry-planned"
            value="planned"
            label="Planned"
          />
        </Tabs>
      )}
      <Stack
        spacing={2.5}
        sx={{ pt: 1 }}
        role={isNew ? "tabpanel" : undefined}
        id={isNew ? `entry-${planned ? "planned" : "running"}` : undefined}
        aria-labelledby={
          isNew ? `entry-${planned ? "planned" : "running"}-tab` : undefined
        }
      >
        {planned ? (
          <>
            <PlannedTryFields
              value={input}
              onChange={changeInput}
              timezone={timezone}
              types={types}
            />
            {onCalculate && (
              <Button
                variant="outlined"
                disabled={invalid}
                onClick={() => onCalculate(draft())}
              >
                Calculate start time
              </Button>
            )}
            {retainsStart && finish.startAt && (
              <Typography variant="body2">
                Start time: {formatPlannerDateTime(finish.startAt, timezone)}
              </Typography>
            )}
          </>
        ) : (
          <>
            <TextField
              label="Title"
              error={titleTouched && !input.title.trim()}
              helperText={
                titleTouched && !input.title.trim()
                  ? "Enter a title."
                  : undefined
              }
              onBlur={() => setTitleTouched(true)}
              fullWidth
              value={input.title}
              onChange={(event) => changeInput({ title: event.target.value })}
              required
            />
            <MushroomTypeField
              value={input.type}
              onChange={(type) => changeInput({ type })}
              types={types}
            />
            {useCountdown ? (
              <Box
                component="fieldset"
                sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
              >
                <Typography component="legend" variant="body2" sx={{ mb: 1.5 }}>
                  Time remaining
                </Typography>
                <CountdownFields
                  value={remaining}
                  onChange={(unit, value) => {
                    setCountdownTouched(true);
                    setRemaining((previous) => ({
                      ...previous,
                      [unit]: value,
                    }));
                  }}
                />
                {countdownTouched &&
                  Object.values(remaining).every(
                    (value) => value == null || value === 0,
                  ) && (
                    <Typography role="alert" variant="caption" color="error">
                      Enter time remaining.
                    </Typography>
                  )}
              </Box>
            ) : (
              <PlannerFinishField
                value={input.wallTime}
                minValue={trackStartDate && input.tryDay && validTryDate(input.tryDay) ? `${input.tryDay}T00:00:00` : undefined}
                onChange={(wallTime) => changeInput({ wallTime })}
                occurrence={input.occurrence}
                onOccurrenceChange={(occurrence) => changeInput({ occurrence })}
                timezone={timezone}
              />
            )}
          </>
        )}
        {!planned && finish.source === "screenshot" && (
          <PlannerTryDateField
            value={input.tryDay}
            maxDate={latestStartDate}
            maxDateMessage={finish.capturedAt ? "Choose a date on or before screenshot capture." : undefined}
            onChange={(tryDay) => changeInput({ tryDay })}
          />
        )}
        {!isNew && (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={missed}
                onChange={(_, checked) => setMissed(checked)}
              />
            }
            label="Exclude from stages"
          />
        )}
      </Stack>
    </ResponsiveDialog>
  );
};
export default PlannerFinishEditor;
