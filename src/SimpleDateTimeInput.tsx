import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Dayjs } from "dayjs";

interface SimpleDateTimeInputProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  readOnly?: boolean;
  disabled?: boolean;
  minDateTime?: Dayjs;
  maxDateTime?: Dayjs;
}

const SimpleDateTimeInput = ({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  minDateTime,
  maxDateTime,
}: SimpleDateTimeInputProps) => (
  <DateTimePicker
    enableAccessibleFieldDOMStructure={false}
    label={label}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    disabled={disabled}
    minDateTime={minDateTime}
    maxDateTime={maxDateTime}
    slotProps={{
      textField: { fullWidth: true },
      actionBar: {
        actions: ["today", "clear", "cancel", "accept"],
      },
    }}
  />
);

export default SimpleDateTimeInput;
