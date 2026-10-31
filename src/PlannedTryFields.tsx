import { Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";
import { localDateTime, selectedFinishTime } from "./stagePlanner";
import PlannerFinishField from "./PlannerFinishField";
import PlannerTryDateField from "./PlannerTryDateField";
import { validTryDate } from "./hypotheticalTries";
import MushroomTypeField from "./MushroomTypeField";

export interface PlannedTryInput {
  title: string;
  wallTime: string;
  occurrence: string;
  type: string;
  tryDay: string;
  extraTry: boolean;
}
export const plannedTryTime = (value: PlannedTryInput, timezone: string) => {
  const instant = selectedFinishTime(
    value.wallTime,
    timezone,
    value.occurrence,
  );
  return instant != null &&
    validTryDate(value.tryDay) &&
    (!value.tryDay ||
      localDateTime(instant, timezone).slice(0, 10) >= value.tryDay)
    ? instant
    : null;
};

const PlannedTryFields = ({
  value,
  onChange,
  timezone,
  types,
}: {
  value: PlannedTryInput;
  onChange: (changes: Partial<PlannedTryInput>) => void;
  timezone: string;
  types: string[];
}) => {
  const instant = selectedFinishTime(
    value.wallTime,
    timezone,
    value.occurrence,
  );
  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        label="Title"
        placeholder="Daily mushroom"
        value={value.title}
        onChange={(event) => onChange({ title: event.target.value })}
      />
      <PlannerFinishField
        value={value.wallTime}
        minValue={
          value.tryDay && validTryDate(value.tryDay)
            ? `${value.tryDay}T00:00:00`
            : undefined
        }
        onChange={(wallTime) => onChange({ wallTime })}
        occurrence={value.occurrence}
        onOccurrenceChange={(occurrence) => onChange({ occurrence })}
        timezone={timezone}
      />
      <MushroomTypeField
        optional
        value={value.type}
        types={types}
        onChange={(type) => onChange({ type })}
      />
      <PlannerTryDateField
        value={value.tryDay}
        maxDate={
          instant != null
            ? localDateTime(instant, timezone).slice(0, 10)
            : undefined
        }
        onChange={(tryDay) => onChange({ tryDay })}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={value.extraTry}
            onChange={(_, extraTry) => onChange({ extraTry })}
          />
        }
        label="Mushroom ticket"
      />
    </Stack>
  );
};
export default PlannedTryFields;
