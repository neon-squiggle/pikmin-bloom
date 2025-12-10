import React, { useState } from "react";
import {
  CardContent,
  CardHeader,
  Divider,
  Card,
  TextField,
  Autocomplete,
  Box,
} from "@mui/material";
import NumberSpinner from "./NumberSpinner";
import dayjs, { Dayjs } from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  mushrooms,
  Mushroom,
  higherBaseAp,
  elementals,
  Estimate,
} from "./types";
import Toggle from "./Toggle";
import Footer from "./Footer";
import { PickerValue } from "@mui/x-date-pickers/internals";

const MushCalcToggle = () => {
  const [mush, setMush] = useState<Mushroom | null>(null);
  const [health, setHealth] = useState<number>(1);
  const [pikminAp, setPikminAp] = useState<number>(2);
  const [apMin, setApMin] = useState<number>(2);
  const [timeLeft, setTimeLeft] = useState<Dayjs | null>(null);
  const [mode, setMode] = useState<Estimate | null>(null);

  const calculate = (
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
  };

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

  const handleModeChange = (e: any, value: Estimate) => {
    if (value) {
      setMode(value);
    }
  };

  const calculateTime = (health: number, ap: number) => {
    const timeEstimate = (health * 100) / ap;
    return dayjs().add(timeEstimate, "second");
  };

  const calculateAp = (health: number, time: Dayjs) => {
    const timeEstimate = dayjs(time).diff(dayjs(), "second");
    return Math.ceil((health * 100) / timeEstimate);
  };

  const calculateHealth = (ap: number, time: Dayjs) => {
    setMush(null);
    const timeEstimate = dayjs(time).diff(dayjs(), "second");
    return Math.ceil((ap * timeEstimate) / 100);
  };

  const message = () => {
    const changeable = ["ap", "time", "health"].filter((val) => val !== mode);
    if (!mode && !mush)
      return (
        "There are three variables (mushroom health, total AP, end time). " +
        "Given any two, the third can be calculated. You'll need to hold one variable " +
        "constant in order to see the relationship between the other two; for instance, " +
        "you need to keep the same mushroom health if you want to see how changing AP affects the end time. "
      );
    if (!mode)
      return (
        "You'll need to pick one variable to hold constant, and then change " +
        "one of the others. Then I can calculate the third for you."
      );
    return `${mode} is held constant; set ${changeable[0]} to calculate ${changeable[1]}, or vice versa`;
  };

  return (
    <Card variant="elevation">
      <CardHeader
        title="Mushroom calculator"
        subheader={message()}
        action={<Toggle mode={mode} handleModeChange={handleModeChange} />}
      />
      <CardContent>
        <Divider />
        <Box
          sx={{
            display: "flex",
            gap: 8,
            p: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Autocomplete
              disablePortal
              readOnly={mode === "health"}
              options={mushrooms}
              sx={{
                width: 300,
                mt: 3.5,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: mode === "health" ? "green" : "primary",
                  },
                },
              }}
              onChange={(e: any, mush: Mushroom | null) =>
                handleMushChange(mush)
              }
              value={mush}
              renderInput={(params: any) => (
                <TextField
                  {...params}
                  label={`Mushroom Type ${mode === "health" ? "(locked)" : ""}`}
                />
              )}
            />
            <NumberSpinner
              label={`Mushroom Health ${mode === "health" ? "(locked)" : ""}`}
              min={1}
              readOnly={mode === "health"}
              value={health}
              onValueChange={handleHealthChange}
              isToggled={mode === "health"}
            />
          </Box>
        </Box>
        <Box
          sx={{
            p: 2,
            gap: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <NumberSpinner
            label={`Total AP ${mode === "ap" ? "(locked)" : ""}`}
            readOnly={mode === "ap"}
            min={apMin}
            value={pikminAp}
            onValueChange={handleApChange}
            isToggled={mode === "ap"}
          />
        </Box>
        <Box
          sx={{
            p: 2,
            gap: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <DateTimePicker
            label={`Desired End Time ${mode === "time" ? "(locked)" : ""}`}
            readOnly={mode === "time"}
            value={timeLeft}
            onChange={handleTimeChange}
            slotProps={{
              textField: {
                sx: {
                  "& fieldset": {
                    borderColor: mode === "time" ? "green" : "primary",
                  },
                },
              },
            }}
          />
        </Box>
        {<Footer />}
      </CardContent>
    </Card>
  );
};

export default MushCalcToggle;
