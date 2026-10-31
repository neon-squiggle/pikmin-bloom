import { Box } from "@mui/material";
import NumberSpinner from "./NumberSpinner";
import { countdownGridSx } from "./formStyles";
import { TimeRemainingInput } from "./types";

const units = [
  { key: "days", label: "Days", max: undefined },
  { key: "hours", label: "Hours", max: 23 },
  { key: "minutes", label: "Minutes", max: 59 },
  { key: "seconds", label: "Seconds", max: 59 },
] as const;

// Callers retain their own snapshot/validation rules, including whether a blank
// unit means zero. Only input behavior and presentation are shared here.
const CountdownFields = ({
  value,
  onChange,
}: {
  value: TimeRemainingInput;
  onChange: (unit: keyof TimeRemainingInput, value: number | null) => void;
}) => (
  <Box sx={countdownGridSx}>
    {units.map((unit) => (
      <Box key={unit.key} data-testid={`duration-${unit.key}`}>
        <NumberSpinner
          label={unit.label}
          size="small"
          min={0}
          max={unit.max}
          allowDecimal={false}
          value={value[unit.key]}
          onValueChange={(next) => onChange(unit.key, next)}
        />
      </Box>
    ))}
  </Box>
);

export default CountdownFields;
