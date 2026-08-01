import { useEffect, useRef, useState } from "react";
import {
  Box,
  Divider,
  Paper,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Dayjs } from "dayjs";

import { calculateAdditionalAp, calculateApAdditionDelay } from "./helpers";
import DiscordTimestampField from "./DiscordTimestampField";
import NumberSpinner from "./NumberSpinner";
import SimpleDateTimeInput from "./SimpleDateTimeInput";

interface JoinPlannerProps {
  variant: "planned" | "in-progress";
  currentAp: number;
  healthRemaining: number;
  referenceTime: Dayjs;
  baselineEndTime: Dayjs | null;
  initialTargetEndTime?: Dayjs | null;
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

const roundAp = (value: number) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

const formatAp = (value: number) => String(roundAp(value));

const JoinPlanner = ({
  variant,
  currentAp,
  healthRemaining,
  referenceTime,
  baselineEndTime,
  initialTargetEndTime = null,
}: JoinPlannerProps) => {
  const [targetEndTime, setTargetEndTime] = useState<Dayjs | null>(
    initialTargetEndTime,
  );
  const [joinDelaySeconds, setJoinDelaySeconds] = useState(0);
  const [playerCount, setPlayerCount] = useState(1);
  const isPlanned = variant === "planned";

  const baselineSeconds = baselineEndTime
    ? baselineEndTime.diff(referenceTime, "second")
    : 0;
  const secondsUntilTarget = targetEndTime
    ? targetEndTime.diff(referenceTime, "second")
    : 0;
  const targetIsEarlier =
    targetEndTime != null &&
    baselineEndTime != null &&
    secondsUntilTarget > 0 &&
    secondsUntilTarget < baselineSeconds;
  const wasTargetEarlier = useRef(targetIsEarlier);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const justRevealed = targetIsEarlier && !wasTargetEarlier.current;
    wasTargetEarlier.current = targetIsEarlier;
    if (!justRevealed) return;

    resultsRef.current?.scrollIntoView?.({
      behavior: "smooth",
      block: "nearest",
    });
  }, [targetIsEarlier]);

  const sliderMax = Math.max(0, secondsUntilTarget - 1);
  const clampedDelay = Math.min(joinDelaySeconds, sliderMax);
  const joinTime = referenceTime.add(clampedDelay, "second");

  const additionalAp = calculateAdditionalAp({
    currentAp,
    healthRemaining,
    secondsUntilTarget,
    secondsUntilApAdded: clampedDelay,
  });
  const displayedAdditionalAp =
    additionalAp == null ? null : roundAp(additionalAp);

  const updateAdditionalAp = (value: number | null) => {
    if (value == null) return;

    const delay = calculateApAdditionDelay({
      currentAp,
      healthRemaining,
      secondsUntilTarget,
      additionalAp: value,
    });
    if (delay != null) setJoinDelaySeconds(Math.round(delay));
  };

  return (
    <Stack spacing={3}>
      <Divider />
      <Stack spacing={2}>
        <Typography variant="h6">
          {isPlanned
            ? "Optional: with additional players, when should the battle end? "
            : "With additional players, when should the battle end?"}
        </Typography>
        <SimpleDateTimeInput
          label="Desired end time"
          value={targetEndTime}
          onChange={(value) => {
            setTargetEndTime(value);
            setJoinDelaySeconds(0);
          }}
          disabled={baselineEndTime == null}
          minDateTime={referenceTime.add(1, "second")}
          maxDateTime={baselineEndTime ?? undefined}
        />
        <DiscordTimestampField
          label="Desired end time Discord timestamp"
          time={targetEndTime}
        />
      </Stack>

      {targetIsEarlier && (
        <Paper ref={resultsRef} variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Bullhorn time
              </Typography>
              <Typography variant="h5">
                {joinTime.format("ddd, MMM D · h:mm:ss A")}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <DiscordTimestampField
                  label="Bullhorn time Discord timestamp"
                  time={joinTime}
                />
              </Box>
            </Box>

            <Slider
              aria-label="Time until next join"
              value={clampedDelay}
              min={0}
              max={Math.max(1, sliderMax)}
              step={1}
              disabled={sliderMax === 0}
              onChange={(_, value) =>
                setJoinDelaySeconds(Array.isArray(value) ? value[0] : value)
              }
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => formatDuration(value)}
              marks={[
                { value: 0 },
                ...(sliderMax > 0 ? [{ value: sliderMax }] : []),
              ]}
              sx={{
                mt: 1,
                touchAction: "pan-y",
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                mt: -1.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {isPlanned ? "Battle start" : "Now"}
              </Typography>
              {sliderMax > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "right" }}
                >
                  {formatDuration(sliderMax)}
                </Typography>
              )}
            </Box>

            <Divider />

            <Paper
              data-testid="additional-ap-result"
              variant="outlined"
              sx={{
                width: "100%",
                maxWidth: { sm: 520 },
                p: 2,
                borderWidth: 2,
                borderColor: "primary.main",
                bgcolor: "action.hover",
                "& .MuiFormControl-root": {
                  width: "100%",
                },
              }}
            >
              <NumberSpinner
                label="Required total additional AP"
                min={0}
                value={displayedAdditionalAp ?? 0}
                disabled={displayedAdditionalAp == null}
                onValueChange={updateAdditionalAp}
              />
            </Paper>

            {displayedAdditionalAp != null && (
              <Box sx={{ width: "100%", maxWidth: 520 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="div"
                  sx={{ mb: 0.75 }}
                >
                  Number of joining players
                </Typography>
                <ToggleButtonGroup
                  value={playerCount}
                  exclusive
                  fullWidth
                  size="small"
                  onChange={(_, value) =>
                    value != null && setPlayerCount(value)
                  }
                  aria-label="Number of joining players"
                >
                  {[1, 2, 3, 4].map((count) => (
                    <ToggleButton
                      key={count}
                      value={count}
                      aria-label={`${count} joining ${count === 1 ? "player" : "players"}`}
                      sx={{
                        flex: "1 1 0",
                        minWidth: 0,
                        minHeight: { xs: 48, sm: 44 },
                        fontSize: "1rem",
                      }}
                    >
                      {count}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <Typography
                  variant="h6"
                  sx={{ mt: 1 }}
                  data-testid="divided-ap-result"
                >
                  {formatAp(displayedAdditionalAp / playerCount)} AP per player
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default JoinPlanner;
