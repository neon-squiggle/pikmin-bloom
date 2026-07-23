import { useMemo, useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  Paper,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";

import NumberSpinner from "./NumberSpinner";
import { calculateAdditionalAp, durationToSeconds } from "./helpers";
import { TimeRemaining } from "./types";

const defaultTimeRemaining: TimeRemaining = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

export interface ExistingMushroomSeed {
  currentAp: number;
  healthRemaining: number;
  timeRemaining: TimeRemaining;
}

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

const formatAp = (value: number) =>
  String(Math.round((value + Number.EPSILON) * 1000) / 1000);

const toDiscordTimestamp = (time: Dayjs) => `<t:${time.unix()}:f>`;

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
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    initialValues?.timeRemaining ?? defaultTimeRemaining,
  );
  const [snapshotTime] = useState<Dayjs>(() => dayjs());
  const [desiredEndTime, setDesiredEndTime] = useState<Dayjs | null>(
    initialDesiredEndTime,
  );
  const [addDelaySeconds, setAddDelaySeconds] = useState(0);
  const [apDivisor, setApDivisor] = useState<number | null>(null);

  const reportedSeconds = durationToSeconds(timeRemaining);
  const reportedEndTime = useMemo(
    () => snapshotTime.add(reportedSeconds, "second"),
    [reportedSeconds, snapshotTime],
  );
  const secondsUntilTarget = desiredEndTime
    ? desiredEndTime.diff(snapshotTime, "second")
    : 0;
  const targetIsEarlier =
    desiredEndTime != null &&
    secondsUntilTarget > 0 &&
    secondsUntilTarget < reportedSeconds;
  const sliderMax = Math.max(0, secondsUntilTarget - 1);
  const clampedDelay = Math.min(addDelaySeconds, sliderMax);
  const apAdditionTime = snapshotTime.add(clampedDelay, "second");

  const additionalAp = calculateAdditionalAp({
    currentAp,
    healthRemaining,
    secondsUntilTarget,
    secondsUntilApAdded: clampedDelay,
  });

  const updateDuration = (field: keyof TimeRemaining, value: number | null) => {
    setTimeRemaining((prev) => ({ ...prev, [field]: value ?? 0 }));
    setAddDelaySeconds(0);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Current mushroom snapshot</Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        <NumberSpinner
          label="Current AP"
          min={0}
          value={currentAp}
          onValueChange={(value) => setCurrentAp(value ?? 0)}
        />
        <NumberSpinner
          label="Health remaining"
          min={0}
          value={healthRemaining}
          onValueChange={(value) => setHealthRemaining(value ?? 0)}
        />
      </Box>

      <Box>
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

      <Divider />

      <Box>
        <Typography variant="h6">Target finish</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Estimated finish without added AP:{" "}
          {reportedEndTime.format("ddd, MMM D, h:mm:ss A")}
        </Typography>
        <DateTimePicker
          label="Desired end time"
          value={desiredEndTime}
          onChange={(value) => {
            setDesiredEndTime(value);
            setAddDelaySeconds(0);
          }}
          readOnly={false}
          minDateTime={snapshotTime.add(1, "second")}
          maxDateTime={reportedSeconds > 0 ? reportedEndTime : undefined}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </Box>

      {targetIsEarlier && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                When will the AP be added?
              </Typography>
              <Typography variant="h6">
                {clampedDelay === 0
                  ? "Add it now"
                  : `Add it in ${formatDuration(clampedDelay)}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {apAdditionTime.format("ddd, MMM D, h:mm:ss A")}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.25 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  data-testid="ap-addition-discord-timestamp"
                >
                  Discord timestamp: {toDiscordTimestamp(apAdditionTime)}
                </Typography>
                <Tooltip title="Copy Discord timestamp">
                  <IconButton
                    size="small"
                    aria-label="Copy AP addition Discord timestamp"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        toDiscordTimestamp(apAdditionTime),
                      )
                    }
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Slider
              aria-label="Time until AP is added"
              value={clampedDelay}
              min={0}
              max={Math.max(1, sliderMax)}
              step={1}
              disabled={sliderMax === 0}
              onChange={(_, value) =>
                setAddDelaySeconds(Array.isArray(value) ? value[0] : value)
              }
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => formatDuration(value)}
              marks={[
                { value: 0, label: "Now" },
                ...(sliderMax > 0
                  ? [
                      {
                        value: sliderMax,
                        label: formatDuration(sliderMax),
                      },
                    ]
                  : []),
              ]}
              sx={{
                mt: 1,
                touchAction: "pan-y",
                "& .MuiSlider-markLabel[data-index='0']": {
                  transform: {
                    xs: "translateX(0)",
                    sm: "translateX(-50%)",
                  },
                },
                "& .MuiSlider-markLabel[data-index='1']": {
                  transform: {
                    xs: "translateX(-100%)",
                    sm: "translateX(-50%)",
                  },
                },
              }}
            />

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary">
                Additional AP required
              </Typography>
              <Typography
                variant="h4"
                color="primary.main"
                data-testid="additional-ap-result"
                sx={{ overflowWrap: "anywhere" }}
              >
                {additionalAp == null ? "—" : formatAp(additionalAp)}
              </Typography>

              {additionalAp != null && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                    sx={{ mb: 0.75 }}
                  >
                    Split AP for convenience
                  </Typography>
                  <ToggleButtonGroup
                    value={apDivisor}
                    exclusive
                    size="small"
                    onChange={(_, value) => setApDivisor(value)}
                    aria-label="Divide additional AP"
                  >
                    {[2, 3, 4].map((divisor) => (
                      <ToggleButton
                        key={divisor}
                        value={divisor}
                        aria-label={`Divide AP by ${divisor}`}
                      >
                        ÷{divisor}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>

                  {apDivisor && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1 }}
                      data-testid="divided-ap-result"
                    >
                      {formatAp(additionalAp / apDivisor)} AP each
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default ExistingMushroomCalc;
