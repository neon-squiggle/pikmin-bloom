import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ReactNode, useState } from "react";
import { Dayjs } from "dayjs";

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
}: SimpleDateTimeInputProps) => {
  const [pickerError, setPickerError] = useState<string | null>(null);
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
    <DateTimePicker
      onError={(reason) => setPickerError(reason)}
      label={label}
      value={value}
      onChange={onChange}
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
  );
};

export default SimpleDateTimeInput;
