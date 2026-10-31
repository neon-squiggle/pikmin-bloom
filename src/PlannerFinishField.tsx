import { useState } from "react";
import { Stack } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import WallClockProvider from "./WallClockProvider";
import SimpleDateTimeInput from "./SimpleDateTimeInput";
import { finishTimeCandidates } from "./stagePlanner";
import ClockOccurrenceField from "./ClockOccurrenceField";

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
          timezone="UTC"
          // This UTC value carries only the displayed clock. Intl below resolves
          // the chosen IANA zone, including gaps and both repeated occurrences.
          value={value ? dayjs.utc(value) : null}
          onChange={(date) => {
            setTouched(true);
            const next = date?.isValid()
                ? date.format("YYYY-MM-DDTHH:mm:ss")
                : date
                  ? "invalid"
                  : "";
            onChange(next);
            const choices = finishTimeCandidates(next, timezone);
            const previous = candidates.indexOf(Number(occurrence));
            onOccurrenceChange(candidates.length > 1 && choices.length > 1 && previous >= 0
              ? String(choices[previous])
              : "");
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
      <ClockOccurrenceField
        candidates={candidates}
        value={occurrence}
        onChange={onOccurrenceChange}
        timezone={timezone}
      />
    </Stack>
  );
};

export default PlannerFinishField;
