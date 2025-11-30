import React, { useState } from "react";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

const mushrooms = {
  smallRed: 87400,
  smallYellow: 84200,
  smallBlue: 84200,
  smallPurple: 93900,
  smallWhite: 81000,
  smallPink: 81000,
  smallGray: 90700,
  smallIceBlue: 81000,
  normalRed: 670600,
  normalYellow: 645800,
  normalBlue: 645800,
  normalPurple: 720300,
  normalWhite: 621000,
  normalPink: 621000,
  normalGray: 695500,
  normaIceBlue: 621000,
  normalFire: 3850200,
  normalWater: 3816700,
  normalCrystal: 3883600,
  normalElectric: 3816700,
  normalPoisonous: 3783200,
  largeRed: 2916000,
  largeYellow: 2808000,
  largeBlue: 2808000,
  largePurple: 3132000,
  largeWhite: 2700000,
  largePink: 2700000,
  largeGray: 3024000,
  largeIceBlue: 2700000,
  largeFire: 13662000,
  largeWater: 13543200,
  largeCrystal: 13780800,
  largeElectric: 13543200,
  largePoisonous: 13424400,
};

const Calculator = () => {
  const [ap, setAp] = useState<number>(0);
  const [health, setHealth] = useState<number>(0);
  return (
    <Card>
      <Autocomplete
        disablePortal
        options={Object.keys(mushrooms)}
        sx={{ width: 300 }}
        renderInput={(params) => (
          <TextField {...params} label="Mushroom Type" />
        )}
      />
    </Card>
  );
};

export default Calculator;
