import { MenuItem, TextField } from "@mui/material";

// Shared by the planner's wall clocks and the calculator's instant pickers.
const ClockOccurrenceField = ({
  candidates, value, onChange, timezone, disabled = false, min, max,
}: {
  candidates: number[];
  value: string;
  onChange: (value: string) => void;
  timezone: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}) => candidates.length > 1 ? (
  <TextField
    select
    fullWidth
    label="Clock occurrence"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    helperText="This time occurs twice when clocks go back."
  >
    {candidates.map((candidate, index) => (
      <MenuItem
        key={candidate}
        value={String(candidate)}
        disabled={(min != null && candidate < min) || (max != null && candidate > max)}
      >
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
) : null;

export default ClockOccurrenceField;
