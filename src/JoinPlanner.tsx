import { useState } from "react";
import {
  Box,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import SectionAccordion from "./SectionAccordion";
import { Dayjs } from "dayjs";
import { calculateAdditionalAp, calculateApAdditionDelay } from "./helpers";
import DiscordTimestampField from "./DiscordTimestampField";
import NumberSpinner from "./NumberSpinner";
import SimpleDateTimeInput from "./SimpleDateTimeInput";
import ActionFeedback from "./ActionFeedback";

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
  const [bullhornDraft, setBullhornDraft] = useState<Dayjs | null | undefined>(
    undefined,
  );
  const [apDraft, setApDraft] = useState<number | null | undefined>(undefined);
  const [apError, setApError] = useState("");
  const [apAdjusted, setApAdjusted] = useState(false);
  const baselineSeconds = baselineEndTime?.diff(referenceTime, "second") ?? 0;
  const secondsUntilTarget = targetEndTime?.diff(referenceTime, "second") ?? 0;
  const targetIsEarlier = Boolean(
    targetEndTime?.isValid() &&
    baselineEndTime?.isValid() &&
    secondsUntilTarget > 0 &&
    secondsUntilTarget < baselineSeconds,
  );
  const formatTime = (time: Dayjs) => time.format("MMM D · h:mm A");
  const targetError = !targetEndTime
    ? ""
    : !targetEndTime.isValid()
      ? "Enter a valid date and time."
      : !baselineEndTime
        ? "Enter valid battle values first."
        : secondsUntilTarget <= 0
          ? `Choose an end time after ${formatTime(referenceTime)}.`
          : secondsUntilTarget >= baselineSeconds
            ? `Choose an end time before ${formatTime(baselineEndTime)}.`
            : "";
  const sliderMax = Math.max(0, secondsUntilTarget - 1);
  const clampedDelay = Math.min(joinDelaySeconds, sliderMax);
  const joinTime = referenceTime.add(clampedDelay, "second");
  const latestJoinTime = targetEndTime?.subtract(1, "second") ?? referenceTime;
  const endpointsShareDay = referenceTime.isSame(latestJoinTime, "day");
  const formatEndpoint = (time: Dayjs) =>
    time.format(endpointsShareDay ? "h:mm:ss A" : "MMM D · h:mm:ss A");
  const additionalAp = calculateAdditionalAp({
    currentAp,
    healthRemaining,
    secondsUntilTarget,
    secondsUntilApAdded: clampedDelay,
  });
  const displayedAp = additionalAp == null ? null : roundAp(additionalAp);
  const sliderText = (delay: number) => {
    const ap = calculateAdditionalAp({
      currentAp,
      healthRemaining,
      secondsUntilTarget,
      secondsUntilApAdded: delay,
    });
    return `${formatEndpoint(referenceTime.add(delay, "second"))} · ${ap == null ? "AP unavailable" : `${formatAp(ap)} AP`}`;
  };
  const bullhornError =
    bullhornDraft !== undefined &&
    (!bullhornDraft?.isValid() ||
      bullhornDraft.isBefore(referenceTime) ||
      bullhornDraft.isAfter(latestJoinTime));
  const resetAp = () => {
    setApDraft(undefined);
    setApError("");
    setApAdjusted(false);
  };
  return (
    <SectionAccordion title="Additional players">
      <Stack spacing={3} sx={{ width: "100%" }}>
        <SimpleDateTimeInput
          label="Desired end time"
          value={targetEndTime}
          disabled={baselineEndTime == null}
          onChange={(value) => {
            setTargetEndTime(value);
            setJoinDelaySeconds(0);
            setBullhornDraft(undefined);
            resetAp();
          }}
          error={Boolean(targetError)}
          helperText={targetError || undefined}
          minDateTime={referenceTime.add(1, "second")}
          maxDateTime={baselineEndTime ?? undefined}
        />
        <DiscordTimestampField
          label="Desired end time Discord timestamp"
          time={targetEndTime}
        />
        {targetIsEarlier && (
          <Stack spacing={3}>
            <SimpleDateTimeInput
              label="Bullhorn time"
              value={bullhornDraft !== undefined ? bullhornDraft : joinTime}
              showSeconds
              minDateTime={referenceTime}
              maxDateTime={latestJoinTime}
              error={Boolean(bullhornError)}
              helperText={
                bullhornError
                  ? `Choose a time from ${formatTime(referenceTime)} to ${formatTime(latestJoinTime)}.`
                  : undefined
              }
              onChange={(value) => {
                setBullhornDraft(value);
                resetAp();
                if (
                  value?.isValid() &&
                  !value.isBefore(referenceTime) &&
                  !value.isAfter(latestJoinTime)
                ) {
                  setJoinDelaySeconds(value.diff(referenceTime, "second"));
                  setBullhornDraft(undefined);
                }
              }}
            />
            <DiscordTimestampField
              label="Bullhorn time Discord timestamp"
              time={bullhornError ? null : joinTime}
            />
            <Box>
              <Slider
                aria-label="Bullhorn time"
                value={clampedDelay}
                min={0}
                max={Math.max(1, sliderMax)}
                step={1}
                disabled={sliderMax === 0}
                onChange={(_, value) => {
                  setJoinDelaySeconds(
                    Array.isArray(value) ? value[0] : value,
                  );
                  setBullhornDraft(undefined);
                  resetAp();
                }}
                valueLabelDisplay="auto"
                valueLabelFormat={sliderText}
                getAriaValueText={sliderText}
                marks={[
                  { value: 0 },
                  ...(sliderMax > 0 ? [{ value: sliderMax }] : []),
                ]}
                sx={{
                  touchAction: "pan-y",
                  py: { xs: 2.5, sm: 1.5 },
                  "& .MuiSlider-thumb": {
                    width: { xs: 24, sm: 20 },
                    height: { xs: 24, sm: 20 },
                  },
                }}
              />
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  aria-label={`${variant === "planned" ? "Battle start" : "Now"}: ${formatEndpoint(referenceTime)}`}
                >
                  {formatEndpoint(referenceTime)}
                </Typography>
                {sliderMax > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: "right" }}
                  >
                    {formatEndpoint(latestJoinTime)}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Box data-testid="additional-ap-result">
              <NumberSpinner
                label="Additional AP"
                unit="AP"
                min={0}
                value={apDraft !== undefined ? apDraft : displayedAp}
                disabled={displayedAp == null}
                error={Boolean(apError)}
                helperText={apError || undefined}
                onValueChange={(value) => {
                  setApDraft(value);
                  setApAdjusted(false);
                  const immediateAp = calculateAdditionalAp({
                    currentAp,
                    healthRemaining,
                    secondsUntilTarget,
                    secondsUntilApAdded: 0,
                  });
                  const delay =
                    value == null ||
                    immediateAp == null ||
                    value + 0.0005 < immediateAp
                      ? null
                      : calculateApAdditionDelay({
                          currentAp,
                          healthRemaining,
                          secondsUntilTarget,
                          additionalAp: value,
                        });
                  if (delay == null || delay < 0 || delay > sliderMax)
                    setApError("This AP cannot meet the desired end time.");
                  else {
                    setJoinDelaySeconds(Math.round(delay));
                    setBullhornDraft(undefined);
                    setApError("");
                    setApAdjusted(true);
                  }
                }}
              />
              {apAdjusted && (
                <ActionFeedback message="Bullhorn time adjusted" noticeKey={joinDelaySeconds} onClose={() => setApAdjusted(false)} />
              )}
            </Box>
            {displayedAp != null && !apError && !bullhornError && (
              <Stack spacing={1}>
                <Typography variant="body2">Joining players</Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={playerCount}
                  onChange={(_, value) => {
                    if (value != null) setPlayerCount(value);
                  }}
                  aria-label="Number of joining players"
                >
                  {[1, 2, 3, 4].map((count) => (
                    <ToggleButton
                      key={count}
                      value={count}
                      aria-label={`${count} joining ${count === 1 ? "player" : "players"}`}
                      sx={{ flex: 1, minWidth: 0, minHeight: 44 }}
                    >
                      {count}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Typography
                  component="output"
                  variant="h6"
                  data-testid="divided-ap-result"
                >
                  {formatAp(displayedAp / playerCount)} AP each
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </SectionAccordion>
  );
};
export default JoinPlanner;
