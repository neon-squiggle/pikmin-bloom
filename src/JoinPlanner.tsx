import { useEffect, useRef, useState } from "react";
import {
  Box,
  Divider,
  OutlinedInput,
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

const roundAp = (value: number) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

const formatAp = (value: number) =>
  roundAp(value).toLocaleString(undefined, { maximumFractionDigits: 3 });

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
  const latestJoinTime = targetEndTime?.subtract(1, "second") ?? referenceTime;
  const endpointsShareDay = referenceTime.isSame(latestJoinTime, "day");
  const formatSliderEndpoint = (time: Dayjs) =>
    time.format(endpointsShareDay ? "h:mm:ss A" : "MMM D · h:mm:ss A");

  const additionalAp = calculateAdditionalAp({
    currentAp,
    healthRemaining,
    secondsUntilTarget,
    secondsUntilApAdded: clampedDelay,
  });
  const displayedAdditionalAp =
    additionalAp == null ? null : roundAp(additionalAp);

  const formatRequiredApAtDelay = (delaySeconds: number) => {
    const requiredAp = calculateAdditionalAp({
      currentAp,
      healthRemaining,
      secondsUntilTarget,
      secondsUntilApAdded: delaySeconds,
    });
    return requiredAp == null ? "AP unavailable" : `${formatAp(requiredAp)} AP`;
  };

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
    <Stack spacing={4}>
      <Divider />
      <Stack
        spacing={1.5}
        sx={{ width: "100%", maxWidth: 520, alignSelf: "center" }}
      >
        <Typography variant="h6" component="h2">
          With additional players, when should the battle end?
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
        <Stack
          ref={resultsRef}
          spacing={4}
          sx={{ width: "100%", maxWidth: 520, alignSelf: "center" }}
        >
          <Stack spacing={1.25}>
            <Typography variant="h6" component="p">
              If you bullhorn at
            </Typography>
            <OutlinedInput
              value={joinTime.format("ddd, MMM D · h:mm:ss A")}
              readOnly
              size="small"
              slotProps={{
                input: { "aria-label": "Selected bullhorn time" },
              }}
              sx={{
                width: "100%",
                "& input": {
                  py: 1,
                  fontWeight: 600,
                },
              }}
            />
            <DiscordTimestampField
              label="Bullhorn time Discord timestamp"
              time={joinTime}
            />
            <Slider
              aria-label="Bullhorn time"
              value={clampedDelay}
              min={0}
              max={Math.max(1, sliderMax)}
              step={1}
              disabled={sliderMax === 0}
              onChange={(_, value) =>
                setJoinDelaySeconds(Array.isArray(value) ? value[0] : value)
              }
              valueLabelDisplay="auto"
              valueLabelFormat={formatRequiredApAtDelay}
              getAriaValueText={formatRequiredApAtDelay}
              marks={[
                { value: 0 },
                ...(sliderMax > 0 ? [{ value: sliderMax }] : []),
              ]}
              sx={{
                mt: 1.5,
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
              <Typography
                variant="caption"
                color="text.secondary"
                aria-label={`${isPlanned ? "Battle start" : "Now"}: ${formatSliderEndpoint(referenceTime)}`}
              >
                {formatSliderEndpoint(referenceTime)}
              </Typography>
              {sliderMax > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "right" }}
                >
                  {formatSliderEndpoint(latestJoinTime)}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack spacing={1.25}>
            <Typography variant="h6" component="p">
              then, in total, you’ll need
            </Typography>
            <Box
              data-testid="additional-ap-result"
              sx={{
                width: { xs: "100%", sm: 240 },
                "& .MuiInputBase-input": {
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                },
              }}
            >
              <NumberSpinner
                label="Required total additional AP"
                hideLabel
                unit="AP"
                min={0}
                value={displayedAdditionalAp ?? 0}
                disabled={displayedAdditionalAp == null}
                onValueChange={updateAdditionalAp}
              />
            </Box>
          </Stack>

          {displayedAdditionalAp != null && (
            <Stack spacing={1.25}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="body1">or, if</Typography>
                <ToggleButtonGroup
                  value={playerCount}
                  exclusive
                  size="small"
                  onChange={(_, value) =>
                    value != null && setPlayerCount(value)
                  }
                  aria-label="Number of joining players"
                  sx={{ width: { xs: "100%", sm: 240 } }}
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
                <Typography variant="body1">
                  {playerCount === 1
                    ? "player is joining,"
                    : "players are joining,"}
                </Typography>
              </Box>
              <Typography
                component="output"
                variant="h6"
                data-testid="divided-ap-result"
              >
                each person needs{" "}
                <Box
                  component="span"
                  sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                >
                  {formatAp(displayedAdditionalAp / playerCount)} AP.
                </Box>
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default JoinPlanner;
