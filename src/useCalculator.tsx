import React, { useCallback, useState } from "react";
import { Dayjs } from "dayjs";
import { PickerValue } from "@mui/x-date-pickers/internals";
import { Mushroom, Estimate, higherBaseAp, elementals } from "./types";
import { calculateAp, calculateHealth, calculateTime } from "./helpers";

export function useCalculator() {
  const [mush, setMush] = useState<Mushroom | null>(null);
  const [health, setHealth] = useState<number>(1);
  const [pikminAp, setPikminAp] = useState<number>(2);
  const [apMin, setApMin] = useState<number>(2);
  const [timeLeft, setTimeLeft] = useState<Dayjs | null>(null);
  const [mode, setMode] = useState<Estimate | null>(null);

  const calculate = useCallback(
    (
      change: Estimate,
      next: {
        ap?: number | null;
        time?: Dayjs | null;
        health?: number | null;
      } = {}
    ) => {
      if (!mode) return;
      const { ap = null, time = null, health = null } = next;
      const compute: Record<string, any> = {
        time: {
          health: () => {
            if (!health || !time) return;
            setPikminAp(calculateAp(health, time));
          },
          ap: () => {
            if (!ap || !time) return;
            setHealth(calculateHealth(ap, time));
          },
        },
        ap: {
          health: () => {
            if (!health || !ap) return;
            setTimeLeft(calculateTime(health, ap));
          },
          time: () => {
            if (!ap || !time) return;
            setHealth(calculateHealth(ap, time));
          },
        },
        health: {
          ap: () => {
            if (!health || !ap) return;
            setTimeLeft(calculateTime(health, ap));
          },
          time: () => {
            if (!health || !time) return;
            setPikminAp(calculateAp(health, time));
          },
        },
      };
      compute[mode]?.[change ?? "health"]();
    },
    [mode, health, pikminAp, timeLeft]
  );

  const handleMushChange = (mush: Mushroom | null) => {
    const mushHealth = mush?.value ?? 1;
    const mushLabel = mush?.label ?? "";
    setMush(mush);
    setHealth(mushHealth);
    let newAp = pikminAp;
    if (higherBaseAp.some((color) => mushLabel.includes(color))) {
      newAp = 5;
      setApMin(newAp);
      if (pikminAp < newAp) setPikminAp(newAp);
    } else if (elementals.some((elem) => mushLabel.includes(elem))) {
      newAp = 100;
      setApMin(newAp);
      if (pikminAp < newAp) setPikminAp(newAp);
    } else {
      newAp = 2;
      setApMin(newAp);
      if (pikminAp < newAp) setPikminAp(newAp);
    }
    calculate("health", {
      ap: newAp,
      health: mushHealth,
      time: timeLeft,
    });
  };

  const handleHealthChange = (value: number | null) => {
    setMush(null);
    setHealth(value ?? 1);
    calculate("health", {
      ap: pikminAp,
      time: timeLeft,
      health: value ?? 1,
    });
  };

  const handleApChange = (value: number | null) => {
    const ap = Math.ceil(value ?? 1);
    setPikminAp(ap);
    calculate("ap", {
      ap,
      time: timeLeft,
      health,
    });
  };

  const handleTimeChange = (value: PickerValue) => {
    setTimeLeft(value);
    calculate("time", {
      ap: pikminAp,
      time: value,
      health,
    });
  };

  const handleModeChange = (value: Estimate) => {
    if (value) {
      setMode(value);
    }
  };

  return {
    mush,
    health,
    apMin,
    pikminAp,
    timeLeft,
    mode,

    handleMushChange,
    handleApChange,
    handleHealthChange,
    handleTimeChange,
    handleModeChange,
  };
}
