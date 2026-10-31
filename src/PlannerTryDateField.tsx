import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import WallClockProvider from "./WallClockProvider";

const PlannerTryDateField = ({
  value,
  onChange,
  maxDate,
  maxDateMessage = "Choose a date on or before the end time.",
}: {
  value: string;
  onChange: (value: string) => void;
  maxDate?: string;
  maxDateMessage?: string;
}) => {
  // Keep MUI's draft date, including an invalid/partial edit, until corrected.
  const [date, setDate] = useState(() => (value ? dayjs.utc(value) : null));
  const [pickerError, setPickerError] = useState<string | null>(null);
  useEffect(() => {
    if (value !== "invalid") setDate(value ? dayjs.utc(value) : null);
  }, [value]);
  return (
    <WallClockProvider>
      <DatePicker
        timezone="UTC"
        label="Start date"
        value={date}
        maxDate={maxDate ? dayjs.utc(maxDate) : undefined}
        onChange={(next, context) => {
          setDate(next);
          onChange(
            context.validationError || (next && !next.isValid())
              ? "invalid"
              : next
                ? next.format("YYYY-MM-DD")
                : "",
          );
        }}
        onError={(reason, next) => {
          setPickerError(reason);
          onChange(
            reason || (next && !next.isValid())
              ? "invalid"
              : next
                ? next.format("YYYY-MM-DD")
                : "",
          );
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            helperText: pickerError
              ? pickerError === "maxDate"
                ? maxDateMessage
                : "Enter a valid start date."
              : undefined,
          },
        }}
      />
    </WallClockProvider>
  );
};
export default PlannerTryDateField;
