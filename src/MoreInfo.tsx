import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Autocomplete } from "@mui/material";

import {
  MushroomTry,
  Mushroom,
  mushrooms,
  TimeRemaining,
  MushroomData,
  TimeUnit,
} from "./types";
import { diffToTimeRemaining, isInvalidDuration } from "./helpers";
import dayjs, { Dayjs } from "dayjs";
import { useSharedMushroomTries } from "./Provider";

import NumberSpinner from "./NumberSpinner";

interface MoreInfoProps {
  mushEvent: MushroomTry | null;
  onDelete: () => void;
}

const DEFAULT_TIMELEFT = { days: 0, hours: 0, minutes: 0, seconds: 0 };

const MoreInfo = ({ mushEvent, onDelete }: MoreInfoProps) => {
  const [name, setName] = useState<string>(mushEvent?.name ?? "");
  const [mush, setMush] = useState<Mushroom | null>(mushEvent?.mush ?? null);
  const [pikminAp, setPikminAp] = useState<number>(mushEvent?.pikminAp ?? 2);
  const [endTime, setEndTime] = useState<Dayjs>(mushEvent?.endTime ?? dayjs());
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    mushEvent?.endTime
      ? diffToTimeRemaining(mushEvent?.endTime)
      : DEFAULT_TIMELEFT
  );
  const [draftId, setDraftId] = useState<string | null>(mushEvent?.id ?? null);

  const { addEvent, updateEvent, deleteEvent } = useSharedMushroomTries();

  useEffect(() => {
    setDraftId(mushEvent?.id ?? null);
  }, [mushEvent]);

  useEffect(() => {
    setName(mushEvent?.name ?? "");
    setMush(mushEvent?.mush ?? null);
    setPikminAp(mushEvent?.pikminAp ?? 2);
    setTimeLeft(
      mushEvent?.endTime
        ? diffToTimeRemaining(mushEvent.endTime)
        : DEFAULT_TIMELEFT
    );
  }, [mushEvent]);

  const handleNameChange = (value: string) => {
    if (!value) return;
    setName(value);
  };

  const handleMushChange = (value: Mushroom | null) => {
    if (!value) return;
    setMush(value);
  };

  const handleApChange = (value: number | null) => {
    if (!value) return;
    setPikminAp(value);
  };

  const applyTimeDelta = (
    value: number | null,
    field: keyof TimeRemaining,
    unit: TimeUnit,
    setTimeLeft: React.Dispatch<React.SetStateAction<TimeRemaining>>,
    setEndTime: React.Dispatch<React.SetStateAction<Dayjs>>
  ) => {
    if (value == null) return;

    setTimeLeft((prev) => {
      const delta = value - prev[field];

      setEndTime((t) => (t ? t.add(delta, unit) : t));

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleRevert = () => {
    setName(mushEvent?.name ?? "");
    setMush(mushEvent?.mush ?? null);
    setPikminAp(mushEvent?.pikminAp ?? 2);
    setTimeLeft(
      mushEvent?.endTime
        ? diffToTimeRemaining(mushEvent?.endTime)
        : DEFAULT_TIMELEFT
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        p: 1,
        overflowY: "auto",
      }}
    >
      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          label="Name"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
        />
        <Autocomplete
          disablePortal
          options={mushrooms}
          onChange={(e: any, mush: Mushroom | null) => handleMushChange(mush)}
          value={mush}
          renderInput={(params: any) => (
            <TextField {...params} label={`Mushroom Type`} />
          )}
        />
        <NumberSpinner
          label={`Total AP`}
          min={2}
          value={pikminAp}
          onValueChange={handleApChange}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <NumberSpinner
            label="Days"
            value={timeLeft.days}
            onValueChange={(value) => {
              applyTimeDelta(value, "days", "day", setTimeLeft, setEndTime);
            }}
          />
          <NumberSpinner
            label="Hours"
            value={timeLeft.hours}
            onValueChange={(value) =>
              applyTimeDelta(value, "hours", "hour", setTimeLeft, setEndTime)
            }
          />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <NumberSpinner
            label="Minutes"
            value={timeLeft.minutes}
            onValueChange={(value) =>
              applyTimeDelta(
                value,
                "minutes",
                "minute",
                setTimeLeft,
                setEndTime
              )
            }
          />
          <NumberSpinner
            label="Seconds"
            value={timeLeft.seconds}
            onValueChange={(value) =>
              applyTimeDelta(
                value,
                "seconds",
                "second",
                setTimeLeft,
                setEndTime
              )
            }
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mt: 1,
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
        <Button variant="outlined" onClick={() => handleRevert()}>
          Revert
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            if (draftId) {
              updateEvent(draftId, {
                name,
                pikminAp,
                mush: mush ?? mushEvent?.mush,
                endTime,
              });
            } else {
              const id = crypto.randomUUID();
              addEvent({
                id,
                name,
                pikminAp,
                mush: mush as Mushroom,
                health: (mush as Mushroom).value,
                endTime,
              });
              setDraftId(id);
            }
          }}
          disabled={
            !mush || !pikminAp || isInvalidDuration(timeLeft) || !endTime
          }
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default MoreInfo;
