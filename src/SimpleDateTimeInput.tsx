import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Dayjs } from "dayjs";

interface SimpleDateTimeInputProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  readOnly?: boolean;
  disabled?: boolean;
  isToggled?: boolean;
  showNowAction?: boolean;
  minDateTime?: Dayjs;
  maxDateTime?: Dayjs;
  hideLabel?: boolean;
}

const SimpleDateTimeInput = ({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  isToggled = false,
  showNowAction = false,
  minDateTime,
  maxDateTime,
  hideLabel = false,
}: SimpleDateTimeInputProps) => (
  <DateTimePicker
    enableAccessibleFieldDOMStructure={false}
    label={label}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    disabled={disabled}
    localeText={showNowAction ? { todayButtonLabel: "Now" } : undefined}
    minDateTime={minDateTime}
    maxDateTime={maxDateTime}
    slotProps={{
      textField: {
        fullWidth: true,
        sx: {
          "& .MuiInputLabel-root": {
            color: isToggled ? "success.main" : undefined,
            ...(hideLabel && {
              position: "absolute",
              width: 1,
              height: 1,
              p: 0,
              m: -1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
              whiteSpace: "nowrap",
              border: 0,
            }),
          },
          "& .MuiOutlinedInput-notchedOutline legend": {
            maxWidth: hideLabel ? 0 : undefined,
          },
          "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
            borderColor: isToggled ? "success.main" : undefined,
          },
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: isToggled ? "success.main" : undefined,
          },
        },
      },
      actionBar: {
        actions: showNowAction
          ? ["today", "clear", "cancel", "accept"]
          : ["clear", "cancel", "accept"],
      },
    }}
  />
);

export default SimpleDateTimeInput;
