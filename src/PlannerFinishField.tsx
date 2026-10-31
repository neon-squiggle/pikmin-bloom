import { useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import WallClockProvider from "./WallClockProvider";
import SimpleDateTimeInput from "./SimpleDateTimeInput";
import { finishTimeCandidates } from "./stagePlanner";

dayjs.extend(utc);

interface PlannerFinishFieldProps {
  value: string;
  onChange: (value: string) => void;
  occurrence: string;
  onOccurrenceChange: (value: string) => void;
  timezone: string;
  label?: string;
  validationMessage?: string;
  minValue?: string;
}

const PlannerFinishField = ({
  value,
  onChange,
  occurrence,
  onOccurrenceChange,
  timezone,
  label = "End time",
  validationMessage,
  minValue,
}: PlannerFinishFieldProps) => {
  const [touched, setTouched] = useState(false);
  const candidates = finishTimeCandidates(value, timezone);
  const invalid = Boolean((value || touched) && candidates.length === 0);
  return (
    <Stack spacing={2}>
      <WallClockProvider>
        <SimpleDateTimeInput
          label={label}
          // This UTC value carries only the displayed clock. Intl below resolves
          // the chosen IANA zone, including gaps and both repeated occurrences.
          value={value ? dayjs.utc(value) : null}
          onChange={(date) => {
            setTouched(true);
            onChange(
              date?.isValid()
                ? date.format("YYYY-MM-DDTHH:mm:ss")
                : date
                  ? "invalid"
                  : "",
            );
            onOccurrenceChange("");
          }}
          showSeconds
          minDateTime={minValue ? dayjs.utc(minValue) : undefined}
          required
          error={invalid || validationMessage ? true : undefined}
          helperText={
            validationMessage ||
            (invalid ? "Enter a valid date and time." : undefined)
          }
        />
      </WallClockProvider>
      {candidates.length > 1 && (
        <TextField
          select
          fullWidth
          label="Clock occurrence"
          value={occurrence}
          onChange={(event) => onOccurrenceChange(event.target.value)}
          helperText="Choose first or second occurrence."
        >
          {candidates.map((candidate, index) => (
            <MenuItem key={candidate} value={String(candidate)}>
              {index === 0 ? "First" : "Second"} ·{" "}
              {new Intl.DateTimeFormat(undefined, {
                timeZone: timezone,
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              }).format(new Date(candidate))}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Stack>
  );
};

export default PlannerFinishField;
