import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ReactNode, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { Stack } from "@mui/material";
import ClockOccurrenceField from "./ClockOccurrenceField";
import { finishTimeCandidates, localDateTime, preserveClockOccurrence } from "./wallClock";

dayjs.extend(utc);

interface SimpleDateTimeInputProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  readOnly?: boolean;
  disabled?: boolean;
  showNowAction?: boolean;
  minDateTime?: Dayjs;
  maxDateTime?: Dayjs;
  showSeconds?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  timezone?: "system" | "UTC";
}

const SimpleDateTimeInput = ({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  showNowAction = false,
  minDateTime,
  maxDateTime,
  showSeconds = false,
  required = false,
  error,
  helperText,
  timezone = "system",
}: SimpleDateTimeInputProps) => {
  const [pickerError, setPickerError] = useState<string | null>(null);
  const zone = timezone === "system"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : timezone;
  const candidates = value?.isValid()
    ? finishTimeCandidates(localDateTime(value.valueOf(), zone), zone)
    : [];
  const fromInstant = (instant: number) => timezone === "system"
    ? dayjs(instant)
    : dayjs.utc(instant);
  const errorMessage =
    pickerError == null
      ? undefined
      : pickerError.startsWith("min")
        ? minDateTime
          ? `Choose a time on or after ${minDateTime.format("MMM D · h:mm A")}.`
          : "Choose a later date."
        : pickerError.startsWith("max")
          ? maxDateTime
            ? `Choose a time on or before ${maxDateTime.format("MMM D · h:mm A")}.`
            : "Choose an earlier date."
          : "Enter a valid date and time.";
  return (
    <Stack spacing={2}>
      <DateTimePicker
        onError={(reason) => setPickerError(reason)}
        label={label}
        value={value}
        timezone={timezone}
        onChange={(next) => {
          if (!next?.isValid()) return onChange(next);
          const instant = preserveClockOccurrence(next.valueOf(), value?.valueOf(), zone);
          onChange(instant === next.valueOf() ? next : fromInstant(instant));
        }}
        readOnly={readOnly}
        disabled={disabled}
        localeText={showNowAction ? { todayButtonLabel: "Now" } : undefined}
        minDateTime={minDateTime}
        maxDateTime={maxDateTime}
        views={
          showSeconds ? ["year", "day", "hours", "minutes", "seconds"] : undefined
        }
        timeSteps={showSeconds ? { minutes: 1, seconds: 1 } : undefined}
        slotProps={{
          textField: {
            fullWidth: true,
            required,
            error: error ?? Boolean(pickerError),
            helperText: helperText ?? errorMessage,
          },
          actionBar: {
            actions: showNowAction
              ? ["today", "clear", "cancel", "accept"]
              : ["clear", "cancel", "accept"],
          },
        }}
      />
      <ClockOccurrenceField
        candidates={candidates}
        timezone={zone}
        value={value?.isValid() ? String(Math.floor(value.valueOf() / 1000) * 1000) : ""}
        onChange={(instant) => onChange(fromInstant(Number(instant) + (value?.millisecond() ?? 0)))}
        disabled={disabled || readOnly}
        min={minDateTime?.valueOf()}
        max={maxDateTime?.valueOf()}
      />
    </Stack>
  );
};

export default SimpleDateTimeInput;
