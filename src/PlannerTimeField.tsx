import { useEffect, useId, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import WallClockProvider from "./WallClockProvider";

dayjs.extend(utc);
const clockValue = (value: string) =>
  value ? dayjs.utc(`2000-01-01T${value}:00`) : null;

// Sleep is a recurring wall clock, not an instant on the browser's current day.
const PlannerTimeField = ({
  label,
  value,
  onChange,
  descriptionId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  descriptionId?: string;
}) => {
  const id = useId();
  const [draft, setDraft] = useState(() => clockValue(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setDraft(clockValue(value));
  }, [value]);
  return (
    <WallClockProvider>
      <TimePicker
        label={label}
        value={draft}
        onError={(reason) => setInvalid(reason != null)}
        onChange={(next) => {
          setDraft(next);
          if (!next) onChange("");
          else if (next.isValid()) onChange(next.format("HH:mm"));
        }}
        slotProps={{
          textField: {
            id,
            fullWidth: true,
            error: invalid,
            helperText: invalid ? "Enter a valid time." : undefined,
            InputProps: { "aria-describedby": [descriptionId, invalid ? `${id}-helper-text` : null].filter(Boolean).join(" ") || undefined },
          },
          actionBar: { actions: ["clear", "cancel", "accept"] },
        }}
      />
    </WallClockProvider>
  );
};
export default PlannerTimeField;
