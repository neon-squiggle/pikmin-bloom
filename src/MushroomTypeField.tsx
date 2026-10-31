import { useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { Mushroom, mushrooms } from "./types";

type MushroomTypeFieldProps =
  | {
      variant: "preset";
      value: Mushroom | null;
      onChange: (value: Mushroom | null) => void;
    }
  | {
      variant?: "custom";
      value: string;
      onChange: (value: string) => void;
      types?: string[];
      optional?: boolean;
      showErrors?: boolean;
    };

const MushroomTypeField = (props: MushroomTypeFieldProps) => {
  const [touched, setTouched] = useState(false);
  if (props.variant === "preset")
    return (
      <Autocomplete
        disablePortal
        options={mushrooms}
        value={props.value}
        onChange={(_, value) => props.onChange(value)}
        renderInput={(params) => (
          <TextField {...params} label="Mushroom type" />
        )}
      />
    );
  const {
    value,
    onChange,
    types = [],
    optional = false,
    showErrors = false,
  } = props;
  const options = Array.from(
    new Set([
      ...mushrooms.map((mushroom) => `${mushroom.label} Mushroom`),
      ...types.filter((type) => Boolean(type) && !/\bhalloween\b/i.test(type)),
    ]),
  );
  return (
    <Autocomplete
      freeSolo
      forcePopupIcon
      fullWidth
      options={options}
      inputValue={value}
      value={options.includes(value) ? value : null}
      onInputChange={(_, input, reason) => {
        if (reason !== "reset") onChange(input);
      }}
      onChange={(_, input) => onChange(input ?? "")}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Mushroom type"
          onBlur={() => setTouched(true)}
          error={!optional && (touched || showErrors) && !value.trim()}
          required={!optional}
          helperText={
            !optional && (touched || showErrors) && !value.trim()
              ? "Choose a mushroom type."
              : undefined
          }
        />
      )}
    />
  );
};
export default MushroomTypeField;
