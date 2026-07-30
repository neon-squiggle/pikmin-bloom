import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  InputAdornment,
  OutlinedInput,
} from "@mui/material";

export interface NumberSpinnerProps {
  id?: string;
  label?: React.ReactNode;
  value?: number | null;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  size?: "small" | "medium";
  isToggled?: boolean;
  helperText?: React.ReactNode;
  unit?: React.ReactNode;
  showStepper?: boolean;
  allowDecimal?: boolean;
  onValueChange?: (value: number | null) => void;
}

const sanitizeNumericInput = (rawValue: string, allowDecimal: boolean) => {
  const digitsAndDots = rawValue.replace(/[,\s]/g, "").replace(/[^\d.]/g, "");
  if (!allowDecimal) return digitsAndDots.replace(/\./g, "");

  const [whole = "", ...decimalParts] = digitsAndDots.split(".");
  return decimalParts.length
    ? `${whole}.${decimalParts.join("")}`
    : whole;
};

const parseNumericInput = (
  rawValue: string,
  allowDecimal: boolean,
): number | null => {
  const normalized = sanitizeNumericInput(rawValue, allowDecimal);
  if (!normalized) return null;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

const formatFriendlyNumber = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });
};

export default function NumberSpinner({
  id: idProp,
  label,
  value = null,
  min,
  max,
  step = 1,
  disabled = false,
  readOnly = false,
  required = false,
  error = false,
  size = "medium",
  isToggled = false,
  helperText,
  unit,
  showStepper = false,
  allowDecimal = true,
  onValueChange,
}: NumberSpinnerProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;
  const [inputValue, setInputValue] = React.useState(() =>
    formatFriendlyNumber(value),
  );
  const focusedRef = React.useRef(false);

  React.useEffect(() => {
    if (!focusedRef.current) setInputValue(formatFriendlyNumber(value));
  }, [value]);

  const clamp = (nextValue: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, nextValue));

  const commit = (nextValue: number | null) => {
    if (nextValue == null) {
      setInputValue("");
      onValueChange?.(null);
      return;
    }
    const clamped = clamp(nextValue);
    setInputValue(formatFriendlyNumber(clamped));
    onValueChange?.(clamped);
  };

  const adjust = (direction: -1 | 1) => {
    const parsed = parseNumericInput(inputValue, allowDecimal);
    commit((parsed ?? value ?? min ?? 0) + direction * step);
  };

  return (
    <FormControl
      fullWidth
      size={size}
      disabled={disabled}
      required={required}
      error={error}
      variant="outlined"
    >
      <FormLabel
        htmlFor={id}
        sx={{
          mb: 0.75,
          color: isToggled ? "success.main" : "text.primary",
          fontWeight: 500,
        }}
      >
        {label}
      </FormLabel>
      <Box sx={{ display: "flex" }}>
        {showStepper && !readOnly && (
          <Button
            variant="outlined"
            aria-label={`Decrease ${String(label ?? "value")} by ${step}`}
            disabled={disabled || (min != null && (value ?? min) <= min)}
            onClick={() => adjust(-1)}
            sx={{
              minWidth: { xs: 48, sm: 44 },
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: 0,
            }}
          >
            <RemoveIcon fontSize={size} />
          </Button>
        )}
        <OutlinedInput
          id={id}
          value={inputValue}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={(event) => {
            focusedRef.current = true;
            event.currentTarget.querySelector("input")?.select();
          }}
          onBlur={() => {
            focusedRef.current = false;
            const parsed = parseNumericInput(inputValue, allowDecimal);
            if (parsed == null) {
              setInputValue(formatFriendlyNumber(value));
              return;
            }
            commit(parsed);
          }}
          onChange={(event) => {
            const sanitized = sanitizeNumericInput(
              event.target.value,
              allowDecimal,
            );
            setInputValue(sanitized);
            const parsed = parseNumericInput(sanitized, allowDecimal);
            if (parsed != null) onValueChange?.(parsed);
            if (!sanitized) onValueChange?.(null);
          }}
          endAdornment={
            unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined
          }
          slotProps={{
            input: {
              inputMode: allowDecimal ? "decimal" : "numeric",
              pattern: allowDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*",
              "aria-label": typeof label === "string" ? label : undefined,
            },
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: showStepper && !readOnly ? 0 : 1,
            "& input": {
              textAlign: readOnly ? "left" : "right",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isToggled ? "success.main" : undefined,
            },
          }}
        />
        {showStepper && !readOnly && (
          <Button
            variant="outlined"
            aria-label={`Increase ${String(label ?? "value")} by ${step}`}
            disabled={disabled || (max != null && (value ?? max) >= max)}
            onClick={() => adjust(1)}
            sx={{
              minWidth: { xs: 48, sm: 44 },
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: 0,
            }}
          >
            <AddIcon fontSize={size} />
          </Button>
        )}
      </Box>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
