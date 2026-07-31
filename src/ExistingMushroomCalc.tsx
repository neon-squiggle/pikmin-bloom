import { useEffect, useMemo, useRef, useState } from "react";
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
  days: null,
  hours: null,
  minutes: null,
  seconds: null,
};

const WARNING_DEBOUNCE_MS = 400;

const revealNextMobileField = (element: HTMLElement | null) => {
  if (!element || window.innerWidth > 600) return;

  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const bounds = element.getBoundingClientRect();
  if (bounds.top < 0 || bounds.bottom > viewportHeight - 16) {
    element.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};

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
  const [currentAp, setCurrentAp] = useState<number | null>(
    initialValues?.currentAp ?? null,
  );
  const [healthRemaining, setHealthRemaining] = useState(
    initialValues?.healthRemaining ?? null,
  );
  const [timeRemaining, setTimeRemaining] = useState<TimeRemainingInput>(
    initialValues?.timeRemaining ?? emptyTimeRemaining,
  );
  const [snapshotTime] = useState<Dayjs>(() => dayjs());
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const hoursFieldRef = useRef<HTMLDivElement>(null);
  const minutesFieldRef = useRef<HTMLDivElement>(null);
  const secondsFieldRef = useRef<HTMLDivElement>(null);
  const joinPlannerRef = useRef<HTMLDivElement>(null);
  const [visibleDurationWarning, setVisibleDurationWarning] =
    useState<SnapshotDurationCheck | null>(null);

  const hasAnyTimeRemainingInput = Object.values(timeRemaining).some(
    (value) => value != null,
  );
  const validTimeRemaining = hasAnyTimeRemainingInput
    ? parseTimeRemaining({
        days: timeRemaining.days ?? 0,
        hours: timeRemaining.hours ?? 0,
        minutes: timeRemaining.minutes ?? 0,
        seconds: timeRemaining.seconds ?? 0,
      })
    : null;
  const reportedSeconds = validTimeRemaining
    ? durationToSeconds(validTimeRemaining)
    : null;

  useEffect(() => {
    setVisibleDurationWarning(null);
    if (
      isEditingDuration ||
      reportedSeconds == null ||
      currentAp == null ||
      healthRemaining == null
    ) {
      return;
    }

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
  }, [currentAp, healthRemaining, isEditingDuration, reportedSeconds]);

  const hasCompleteSnapshot =
    currentAp != null &&
    currentAp > 0 &&
    healthRemaining != null &&
    healthRemaining > 0 &&
    reportedSeconds != null;

  const reportedEndTime = useMemo(
    () =>
      hasCompleteSnapshot
        ? snapshotTime.add(reportedSeconds, "second")
        : null,
    [hasCompleteSnapshot, reportedSeconds, snapshotTime],
  );

  const updateDuration = (
    field: keyof TimeRemainingInput,
    value: number | null,
    nextField?: HTMLElement | null,
  ) => {
    setTimeRemaining((prev) => ({ ...prev, [field]: value }));
    if (value != null) revealNextMobileField(nextField ?? null);
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
          allowDecimal={false}
          value={healthRemaining}
          onValueChange={setHealthRemaining}
        />
        <NumberSpinner
          label="AP"
          min={0}
          allowDecimal={false}
          value={currentAp}
          onValueChange={setCurrentAp}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Time remaining shown in the game
        </Typography>
        <Box
          onFocusCapture={() => setIsEditingDuration(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsEditingDuration(false);
            }
          }}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            gap: 1.5,
          }}
        >
          <Box data-testid="duration-days">
            <NumberSpinner
              label="Days"
              min={0}
              allowDecimal={false}
              value={timeRemaining.days}
              onValueChange={(value) =>
                updateDuration("days", value, hoursFieldRef.current)
              }
              size="small"
            />
          </Box>
          <Box ref={hoursFieldRef} data-testid="duration-hours">
            <NumberSpinner
              label="Hours"
              min={0}
              max={23}
              allowDecimal={false}
              value={timeRemaining.hours}
              onValueChange={(value) =>
                updateDuration("hours", value, minutesFieldRef.current)
              }
              size="small"
            />
          </Box>
          <Box ref={minutesFieldRef} data-testid="duration-minutes">
            <NumberSpinner
              label="Minutes"
              min={0}
              max={59}
              allowDecimal={false}
              value={timeRemaining.minutes}
              onValueChange={(value) =>
                updateDuration("minutes", value, secondsFieldRef.current)
              }
              size="small"
            />
          </Box>
          <Box ref={secondsFieldRef} data-testid="duration-seconds">
            <NumberSpinner
              label="Seconds"
              min={0}
              max={59}
              allowDecimal={false}
              value={timeRemaining.seconds}
              onValueChange={(value) =>
                updateDuration("seconds", value, joinPlannerRef.current)
              }
              size="small"
            />
          </Box>
        </Box>
      </Box>

      {visibleDurationWarning &&
        currentAp != null &&
        healthRemaining != null && (
        <Alert severity="warning">
          <strong>These values may not describe the same moment.</strong> At{" "}
          {formatAp(currentAp)} AP, {healthRemaining.toLocaleString()} remaining
          health should take about{" "}
          {formatDuration(visibleDurationWarning.calculatedSeconds)}, but you
          entered {formatDuration(visibleDurationWarning.reportedSeconds)}.
          Calculations below will use the values you entered.
        </Alert>
        )}

      <Box ref={joinPlannerRef}>
        <JoinPlanner
          variant="in-progress"
          currentAp={currentAp ?? 0}
          healthRemaining={healthRemaining ?? 0}
          referenceTime={snapshotTime}
          baselineEndTime={reportedEndTime}
          initialTargetEndTime={initialDesiredEndTime}
        />
      </Box>
    </Stack>
  );
};

export default ExistingMushroomCalc;
