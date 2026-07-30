import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";

import JoinPlanner from "./JoinPlanner";
import NumberSpinner from "./NumberSpinner";
import { durationToSeconds, parseTimeRemaining } from "./helpers";
import {
  checkSnapshotDuration,
  ExistingMushroomSeed,
  SnapshotDurationCheck,
} from "./mushroomCalculator";
import { TimeRemainingInput } from "./types";

const emptyTimeRemaining: TimeRemainingInput = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const WARNING_DEBOUNCE_MS = 400;

const formatDuration = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    minutes ? `${minutes}m` : "",
    seconds || (!days && !hours && !minutes) ? `${seconds}s` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const roundAp = (value: number) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

const formatAp = (value: number) => String(roundAp(value));

const ExistingMushroomCalc = ({
  initialValues,
  initialDesiredEndTime = null,
}: {
  initialValues?: ExistingMushroomSeed | null;
  initialDesiredEndTime?: Dayjs | null;
}) => {
  const [currentAp, setCurrentAp] = useState(initialValues?.currentAp ?? 0);
  const [healthRemaining, setHealthRemaining] = useState(
    initialValues?.healthRemaining ?? 0,
  );
  const [timeRemaining, setTimeRemaining] = useState<TimeRemainingInput>(
    initialValues?.timeRemaining ?? emptyTimeRemaining,
  );
  const [snapshotTime] = useState<Dayjs>(() => dayjs());
  const [visibleDurationWarning, setVisibleDurationWarning] =
    useState<SnapshotDurationCheck | null>(null);

  const validTimeRemaining = parseTimeRemaining(timeRemaining);
  const reportedSeconds = validTimeRemaining
    ? durationToSeconds(validTimeRemaining)
    : null;

  useEffect(() => {
    setVisibleDurationWarning(null);
    if (reportedSeconds == null) return;

    const durationCheck = checkSnapshotDuration(
      currentAp,
      healthRemaining,
      reportedSeconds,
    );
    if (!durationCheck || durationCheck.isConsistent) return;

    const timeout = window.setTimeout(
      () => setVisibleDurationWarning(durationCheck),
      WARNING_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [currentAp, healthRemaining, reportedSeconds]);

  const reportedEndTime = useMemo(
    () =>
      reportedSeconds == null
        ? null
        : snapshotTime.add(reportedSeconds, "second"),
    [reportedSeconds, snapshotTime],
  );

  const updateDuration = (
    field: keyof TimeRemainingInput,
    value: number | null,
  ) => {
    setTimeRemaining((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Current values</Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        <NumberSpinner
          label="Health remaining"
          min={0}
          value={healthRemaining}
          onValueChange={(value) => setHealthRemaining(value ?? 0)}
        />
        <NumberSpinner
          label="AP"
          min={0}
          value={currentAp}
          onValueChange={(value) => setCurrentAp(value ?? 0)}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Time remaining shown in the game
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            gap: 1.5,
          }}
        >
          <NumberSpinner
            label="Days"
            min={0}
            value={timeRemaining.days}
            onValueChange={(value) => updateDuration("days", value)}
            size="small"
          />
          <NumberSpinner
            label="Hours"
            min={0}
            max={23}
            value={timeRemaining.hours}
            onValueChange={(value) => updateDuration("hours", value)}
            size="small"
          />
          <NumberSpinner
            label="Minutes"
            min={0}
            max={59}
            value={timeRemaining.minutes}
            onValueChange={(value) => updateDuration("minutes", value)}
            size="small"
          />
          <NumberSpinner
            label="Seconds"
            min={0}
            max={59}
            value={timeRemaining.seconds}
            onValueChange={(value) => updateDuration("seconds", value)}
            size="small"
          />
        </Box>
      </Box>

      {visibleDurationWarning && (
        <Alert severity="warning">
          <strong>These values may not describe the same moment.</strong> At{" "}
          {formatAp(currentAp)} AP, {healthRemaining.toLocaleString()} remaining
          health should take about{" "}
          {formatDuration(visibleDurationWarning.calculatedSeconds)}, but you
          entered {formatDuration(visibleDurationWarning.reportedSeconds)}.
          Calculations below will use the values you entered.
        </Alert>
      )}

      <JoinPlanner
        variant="in-progress"
        currentAp={currentAp}
        healthRemaining={healthRemaining}
        referenceTime={snapshotTime}
        baselineEndTime={reportedEndTime}
        initialTargetEndTime={initialDesiredEndTime}
      />
    </Stack>
  );
};

export default ExistingMushroomCalc;
