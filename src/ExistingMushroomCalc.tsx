import { useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";

import JoinPlanner from "./JoinPlanner";
import BattleScreenshotUpload from "./BattleScreenshotUpload";
import { BattleScreenshotResult } from "./readBattleScreenshot";
import NumberSpinner from "./NumberSpinner";
import CountdownFields from "./CountdownFields";
import { pairedFieldGridSx } from "./formStyles";
import SimpleDateTimeInput from "./SimpleDateTimeInput";
import {
  calculateRemainingHealth,
  durationToSeconds,
  parseTimeRemaining,
} from "./helpers";
import { ExistingMushroomSeed } from "./mushroomCalculator";
import { TimeRemainingInput } from "./types";

const emptyTimeRemaining: TimeRemainingInput = {
  days: null,
  hours: null,
  minutes: null,
  seconds: null,
};

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
  const [planningTime, setPlanningTime] = useState<Dayjs>(() => dayjs());
  const [snapshotTime, setSnapshotTime] = useState<Dayjs | null>(planningTime);
  const [importedScreenshot, setImportedScreenshot] =
    useState<BattleScreenshotResult | null>(null);
  const [isReadingScreenshot, setIsReadingScreenshot] = useState(false);
  const [snapshotRevision, setSnapshotRevision] = useState(0);
  const [calculateAtCapture, setCalculateAtCapture] = useState(false);
  const referenceTime = calculateAtCapture && snapshotTime?.isValid() ? snapshotTime : planningTime;
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

  const hasCompleteSnapshot =
    currentAp != null &&
    currentAp > 0 &&
    healthRemaining != null &&
    healthRemaining > 0 &&
    reportedSeconds != null &&
    snapshotTime?.isValid();

  const reportedEndTime = useMemo(
    () =>
      hasCompleteSnapshot && snapshotTime
        ? snapshotTime.add(reportedSeconds, "second")
        : null,
    [hasCompleteSnapshot, reportedSeconds, snapshotTime],
  );

  const captureIsFuture = Boolean(
    snapshotTime?.isAfter(planningTime.add(1, "minute")),
  );
  const screenshotHasEnded = Boolean(
    importedScreenshot &&
    reportedEndTime &&
    !reportedEndTime.isAfter(referenceTime),
  );
  const healthForPlanning = snapshotTime
    ? calculateRemainingHealth(
        healthRemaining ?? 0,
        currentAp ?? 0,
        referenceTime.diff(snapshotTime, "second"),
      )
    : 0;

  const applyScreenshot = (result: BattleScreenshotResult) => {
    // Clear unread fields so values from different screenshots cannot be mixed.
    setHealthRemaining(result.healthRemaining);
    setCurrentAp(result.currentAp);
    setTimeRemaining(result.countdown ?? emptyTimeRemaining);
    setSnapshotTime(result.capturedAt ? dayjs(result.capturedAt) : null);
    setPlanningTime(dayjs());
    setCalculateAtCapture(false);
    setImportedScreenshot(result);
    setSnapshotRevision((revision) => revision + 1);
  };

  const updateDuration = (
    field: keyof TimeRemainingInput,
    value: number | null,
  ) => {
    setTimeRemaining((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Stack spacing={3}>
      <BattleScreenshotUpload
        onRead={applyScreenshot}
        onBusyChange={setIsReadingScreenshot}
      />
      <Box
        component="fieldset"
        disabled={isReadingScreenshot}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
      >
        <Stack spacing={3}>
          {importedScreenshot && (
            <Stack spacing={1.5}>
              {importedScreenshot.warnings.length > 0 && (
                <Typography variant="body2" color="error" role="alert">{importedScreenshot.warnings.join(" ")}</Typography>
              )}
              <SimpleDateTimeInput
                label="Screenshot captured at"
                value={snapshotTime}
                error={!snapshotTime || captureIsFuture}
                helperText={!snapshotTime
                  ? "Capture time is missing. Choose when this screenshot was taken to calculate its end time correctly."
                  : captureIsFuture ? "The capture time is in the future. Check the date and time before planning." : undefined}
                onChange={(value) => {
                  setSnapshotTime(value);
                  setPlanningTime(dayjs());
                }}
                showNowAction
                showSeconds
              />
            </Stack>
          )}
          <Typography component="h2" variant="h6">
            {importedScreenshot ? "Screenshot" : "Battle"}
          </Typography>
          <Box sx={pairedFieldGridSx}>
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

          {screenshotHasEnded && (
            <Typography variant="body2" role="status">
              This battle’s projected finish is in the past ({reportedEndTime?.format("MMM D, YYYY · h:mm A")}).
              The screenshot was read successfully. You can keep these values or calculate from its capture time.
            </Typography>
          )}
          {importedScreenshot && snapshotTime?.isValid() && !captureIsFuture && (
            <Stack spacing={1}>
              {calculateAtCapture && <Typography variant="body2" role="status">
                Calculating from screenshot capture time ({snapshotTime.format("MMM D, YYYY · h:mm:ss A")}).
              </Typography>}
              <Button sx={{ alignSelf: "flex-start" }} onClick={() => {
                setCalculateAtCapture(!calculateAtCapture);
                setPlanningTime(dayjs());
                setSnapshotRevision((revision) => revision + 1);
              }}>{calculateAtCapture ? "Calculate from now" : "Calculate at capture time"}</Button>
            </Stack>
          )}

          <Box>
            <Typography component="h3" variant="subtitle2" sx={{ mb: 1 }}>
              Time remaining
            </Typography>
            <CountdownFields value={timeRemaining} onChange={updateDuration} />
          </Box>

          <Box>
            <JoinPlanner
              key={snapshotRevision}
              variant="in-progress"
              currentAp={currentAp ?? 0}
              healthRemaining={healthForPlanning}
              referenceTime={referenceTime}
              referenceLabel={calculateAtCapture ? "Screenshot capture" : "Now"}
              unavailableReason={screenshotHasEnded ? "This battle has ended. Calculate at capture time to explore it." : undefined}
              baselineEndTime={
                captureIsFuture || screenshotHasEnded ? null : reportedEndTime
              }
              initialTargetEndTime={initialDesiredEndTime}
            />
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
};

export default ExistingMushroomCalc;
