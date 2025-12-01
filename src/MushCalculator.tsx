import React, { useState } from "react";
import {
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Card,
  TextField,
  Autocomplete,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import NumberSpinner from "./NumberSpinner";
import dayjs, { Dayjs } from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

interface Mushroom {
  label: string;
  value: number;
}

const mushrooms: Mushroom[] = [
  { label: "Small Red", value: 87400 },
  { label: "Small Yellow", value: 84200 },
  { label: "Small Blue", value: 84200 },
  { label: "Small Purple", value: 93900 },
  { label: "Small White", value: 81000 },
  { label: "Small Pink", value: 81000 },
  { label: "Small Gray", value: 90700 },
  { label: "Small Ice Blue", value: 81000 },
  { label: "Normal Red", value: 670600 },
  { label: "Normal Yellow", value: 645800 },
  { label: "Normal Blue", value: 645800 },
  { label: "Normal Purple", value: 720300 },
  { label: "Normal White", value: 621000 },
  { label: "Normal Pink", value: 621000 },
  { label: "Normal Gray", value: 695500 },
  { label: "Normal Ice Blue", value: 621000 },
  { label: "Normal Fire", value: 3850200 },
  { label: "Normal Water", value: 3816700 },
  { label: "Normal Crystal", value: 3883600 },
  { label: "Normal Electric", value: 3816700 },
  { label: "Normal Poisonous", value: 3783200 },
  { label: "Large Red", value: 2916000 },
  { label: "Large Yellow", value: 2808000 },
  { label: "Large Blue", value: 2808000 },
  { label: "Large Purple", value: 3132000 },
  { label: "Large White", value: 2700000 },
  { label: "Large Pink", value: 2700000 },
  { label: "Large Gray", value: 3024000 },
  { label: "Large Ice Blue", value: 2700000 },
  { label: "Large Fire", value: 13662000 },
  { label: "Large Water", value: 13543200 },
  { label: "Large Crystal", value: 13780800 },
  { label: "Large Electric", value: 13543200 },
  { label: "Large Poisonous", value: 13424400 },
];

const higherBaseAp = ["Yellow", "Purple", "Pink", "Ice Blue"];

const Calculator = () => {
  const [mush, setMush] = useState<Mushroom | null>(null);
  const [health, setHealth] = useState<number>(1);
  const [pikminAp, setPikminAp] = useState<number>(2);
  const [apMin, setApMin] = useState<number>(2);
  const [isEstimate, setIsEstimate] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<Dayjs | null>(null);

  const handleMushChange = (mush: Mushroom | null) => {
    setMush(mush);
    const mushHealth = mush?.value ?? 1;
    setHealth(mushHealth);
    if (pikminAp) {
      setTimeLeft(calculateTime(mushHealth, pikminAp));
    }
    if (higherBaseAp.some((color) => mush?.label.includes(color))) {
      setApMin(5);
      setPikminAp(5);
    } else {
      setApMin(2);
      setPikminAp(2);
    }
  };

  const handleHealthChange = (value: number | null) => {
    setMush(null);
    setHealth(value ?? 1);
  };

  const handleApChange = (value: number | null) => {
    const ap = value ?? 1;
    setPikminAp(ap);
    if (mush) {
      setTimeLeft(calculateTime(mush.value, ap));
    }
  };

  const calculateTime = (health: number, ap: number) => {
    const timeEstimate = (health * 100) / ap;
    return dayjs().add(timeEstimate, "second");
  };

  const calculateAp = (health: number, time: number) => {
    const timeEstimate = dayjs(time).diff(dayjs(), "second");
    return (health * 100) / timeEstimate;
  };

  return (
    <Card variant="elevation">
      <CardHeader title="Mushroom calculator" />
      <CardContent>
        <Typography
          gutterBottom
          variant="body1"
          sx={{ color: "text.secondary" }}
        >
          all three
        </Typography>
        <Divider />
        <Box sx={{ display: "flex", gap: 8, p: 2 }}>
          <Typography variant="h6">Mushroom</Typography>
          <Autocomplete
            disablePortal
            options={mushrooms}
            sx={{ width: 300, paddingTop: 2.75 }}
            onChange={(e: any, mush: Mushroom | null) => handleMushChange(mush)}
            value={mush}
            renderInput={(params: any) => (
              <TextField {...params} label="Mushroom Type" />
            )}
          />
          <NumberSpinner
            label="Mushroom health"
            min={1}
            value={health}
            onValueChange={handleHealthChange}
          />
        </Box>
        <Divider />
        <Box sx={{ p: 2, gap: 8, display: "flex" }}>
          <Typography variant="h6">Attack Power</Typography>
          <NumberSpinner
            min={apMin}
            value={pikminAp}
            onValueChange={handleApChange}
          />
        </Box>
        <Divider />
        <Box sx={{ p: 2, gap: 8, display: "flex" }}>
          <Typography variant="h6">Time</Typography>
          <DateTimePicker
            label="Desired End Time"
            disabled={health === 1}
            value={timeLeft}
            onChange={setTimeLeft}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default Calculator;
