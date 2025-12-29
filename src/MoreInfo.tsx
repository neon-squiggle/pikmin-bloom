import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Autocomplete, Snackbar } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";

import {
  MushroomTry,
  Mushroom,
  mushrooms,
  TimeRemaining,
  TimeUnit,
} from "./types";
import { diffToTimeRemaining, isInvalidDuration } from "./helpers";
import { useSharedMushroomTries } from "./Provider";
import NumberSpinner from "./NumberSpinner";

interface MoreInfoProps {
  mushEvent: MushroomTry | null;
  onDelete: () => void;
}

const DEFAULT_TIMELEFT: TimeRemaining = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const MoreInfo = ({ mushEvent, onDelete }: MoreInfoProps) => {
  const { addEvent, updateEvent, deleteEvent } = useSharedMushroomTries();

  const [name, setName] = useState("");
  const [mush, setMush] = useState<Mushroom | null>(null);
  const [pikminAp, setPikminAp] = useState(0);
  const [endTime, setEndTime] = useState<Dayjs>(dayjs());
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(DEFAULT_TIMELEFT);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [touchedTime, setTouchedTime] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    setName(mushEvent?.name ?? "");
    setMush(mushEvent?.mush ?? null);
    setPikminAp(mushEvent?.pikminAp ?? 0);
    setEndTime(mushEvent?.endTime ?? dayjs());
    setTimeLeft(
      mushEvent?.endTime
        ? diffToTimeRemaining(mushEvent.endTime)
        : DEFAULT_TIMELEFT
    );
    setDraftId(mushEvent?.id ?? null);
  }, [mushEvent]);

  const applyTimeDelta = (
    value: number | null,
    field: keyof TimeRemaining,
    unit: TimeUnit
  ) => {
    if (value == null) return;
    setTimeLeft((prev) => {
      const delta = value - prev[field];
      setEndTime((t) => t.add(delta, unit));
      return { ...prev, [field]: value };
    });
  };

  const saveEvent = () => {
    if (draftId) {
      updateEvent(draftId, {
        name,
        pikminAp,
        mush: mush ?? mushEvent?.mush,
        endTime: touchedTime ? endTime : mushEvent?.endTime,
      });
    } else if (mush) {
      const id = crypto.randomUUID();
      addEvent({ id, name, pikminAp, mush, health: mush.value, endTime });
      setDraftId(id);
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
          onChange={(e) => setName(e.target.value)}
        />
        <Autocomplete
          disablePortal
          options={mushrooms}
          onChange={(e, val) => setMush(val)}
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
            onValueChange={(val) => val != null && setPikminAp(val)}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            alignItems: "start",
          }}
        >
          <Box sx={{ width: "100%" }}>
            <NumberSpinner
              label="Days"
              value={timeLeft.days}
              min={0}
              onValueChange={(v) => applyTimeDelta(v, "days", "day")}
            />
          </Box>

          <Box sx={{ width: "100%" }}>
            <NumberSpinner
              label="Hours"
              value={timeLeft.hours}
              min={0}
              max={23}
              onValueChange={(v) => applyTimeDelta(v, "hours", "hour")}
            />
          </Box>

          <Box sx={{ width: "100%" }}>
            <NumberSpinner
              label="Minutes"
              value={timeLeft.minutes}
              min={0}
              max={59}
              onValueChange={(v) => applyTimeDelta(v, "minutes", "minute")}
            />
          </Box>

          <Box sx={{ width: "100%" }}>
            <NumberSpinner
              label="Seconds"
              value={timeLeft.seconds}
              min={0}
              max={59}
              onValueChange={(v) => applyTimeDelta(v, "seconds", "second")}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 2,
            justifyContent: "flex-end",
            p: 1,
          }}
        >
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
