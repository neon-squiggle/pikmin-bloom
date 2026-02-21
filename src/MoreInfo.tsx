import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  Snackbar,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";

import {
  MushroomEvent,
  Mushroom,
  mushrooms,
  TimeRemaining,
  TimeUnit,
} from "./types";
import { diffToTimeRemaining, isInvalidDuration } from "./helpers";
import { useSharedMushroomTries } from "./Provider";
import NumberSpinner from "./NumberSpinner";

interface MoreInfoProps {
  mushEvent: MushroomEvent | null;
  onDelete: () => void;
}

interface FormState {
  name: string;
  mush: Mushroom | null;
  pikminAp: number;
  endTime: Dayjs;
  draftId: string | null;
}

const createInitialState = (mushEvent: MushroomEvent | null): FormState => ({
  name: mushEvent?.name ?? "",
  mush: mushEvent?.mush ?? null,
  pikminAp: mushEvent?.pikminAp ?? 0,
  endTime: mushEvent?.endTime ?? dayjs(),
  draftId: mushEvent?.id ?? null,
});

const MoreInfo = ({ mushEvent, onDelete }: MoreInfoProps) => {
  const { addEvent, updateEvent, deleteEvent } = useSharedMushroomTries();

  const [form, setForm] = useState<FormState>(() => createInitialState(mushEvent));
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    diffToTimeRemaining(mushEvent?.endTime ?? dayjs())
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const { name, mush, pikminAp, endTime, draftId } = form;

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const applyTimeDelta = (
    value: number | null,
    field: keyof TimeRemaining,
    unit: TimeUnit
  ) => {
    if (value == null) return;
    const delta = value - timeLeft[field];
    const newEndTime = endTime.add(delta, unit);
    updateForm({ endTime: newEndTime });
    setTimeLeft((prev) => ({ ...prev, [field]: value }));
  };

  const saveEvent = () => {
    if (!mush) return;

    if (draftId) {
      updateEvent(draftId, { name, pikminAp, mush, endTime });
    } else {
      const id = crypto.randomUUID();
      addEvent({ id, name, pikminAp, mush, health: mush.value, startTime: dayjs(), endTime });
      updateForm({ draftId: id });
    }
    setSnackbarOpen(true);
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        p: 1,
        overflowY: "auto",
        minWidth: 0,
        minHeight: 0,
        maxHeight: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        noValidate
        autoComplete="off"
      >
        <TextField
          label="Name"
          value={name}
          onChange={(e) => updateForm({ name: e.target.value })}
        />
        <Autocomplete
          disablePortal
          options={mushrooms}
          onChange={(_, val) => updateForm({ mush: val })}
          value={mush}
          renderInput={(params) => (
            <TextField {...params} label="Mushroom Type" />
          )}
        />
        <Box sx={{ width: "100%" }}>
          <NumberSpinner
            label="Total AP"
            min={2}
            value={pikminAp}
            onValueChange={(val) => val != null && updateForm({ pikminAp: val })}
          />
        </Box>
        <TextField
          label="End Time"
          value={endTime.format("ddd, MMM D, YYYY h:mm:ss A")}
          slotProps={{ input: { readOnly: true } }}
          fullWidth
        />
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: "1fr 1fr",
            alignItems: "start",
          }}
        >
          <NumberSpinner
            label="Days"
            value={timeLeft.days}
            min={0}
            onValueChange={(v) => applyTimeDelta(v, "days", "day")}
          />
          <NumberSpinner
            label="Hours"
            value={timeLeft.hours}
            min={0}
            max={23}
            onValueChange={(v) => applyTimeDelta(v, "hours", "hour")}
          />
          <NumberSpinner
            label="Minutes"
            value={timeLeft.minutes}
            min={0}
            max={59}
            onValueChange={(v) => applyTimeDelta(v, "minutes", "minute")}
          />
          <NumberSpinner
            label="Seconds"
            value={timeLeft.seconds}
            min={0}
            max={59}
            onValueChange={(v) => applyTimeDelta(v, "seconds", "second")}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 2,
            justifyContent: "space-between",
            p: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            {draftId && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  deleteEvent(draftId);
                  onDelete();
                }}
              >
                Delete
              </Button>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              disabled={
                !mush || !pikminAp || isInvalidDuration(timeLeft) || !endTime
              }
              onClick={saveEvent}
            >
              Save
            </Button>
          </Box>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={1000}
          onClose={() => setSnackbarOpen(false)}
          message="Result saved"
        />
      </Box>
    </Box>
  );
};

export default MoreInfo;
