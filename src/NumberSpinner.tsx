import * as React from "react";
import { formatNumericInput, parseNumericInput } from "./numericInput";
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  InputAdornment,
  OutlinedInput,
} from "@mui/material";

export interface NumberSpinnerProps {
  locale?: string;
  id?: string;
  label?: React.ReactNode;
  value?: number | null;
  min?: number;
  max?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  size?: "small" | "medium";
  helperText?: React.ReactNode;
  unit?: React.ReactNode;
  allowDecimal?: boolean;
  onValueChange?: (value: number | null) => void;
}

export default function NumberSpinner({
  locale,
  id: idProp,
  label,
  value = null,
  min,
  max,
  disabled = false,
  readOnly = false,
  required = false,
  error = false,
  size = "medium",
  helperText,
  unit,
  allowDecimal = true,
  onValueChange,
}: NumberSpinnerProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;
  const [inputValue, setInputValue] = React.useState(() =>
    formatNumericInput(value, locale),
  );
  const focusedRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectionAfterFormatting = React.useRef<{
    start: number;
    end: number;
    direction: "forward" | "backward" | "none";
  } | null>(null);
  const [touched, setTouched] = React.useState(false);

  React.useLayoutEffect(() => {
    const selection = selectionAfterFormatting.current;
    if (selection) {
      const input = inputRef.current;
      if (input && document.activeElement === input)
        input.setSelectionRange(selection.start, selection.end, selection.direction);
      selectionAfterFormatting.current = null;
    }
  }, [inputValue]);

  React.useEffect(() => {
    if (
      !focusedRef.current &&
      (readOnly || !touched || value == null || Number.isFinite(value))
    )
      setInputValue(formatNumericInput(value, locale));
  }, [value, readOnly, touched, locale]);

  const isValidValue = (next: number | null) =>
    next != null &&
    (min == null || next >= min) &&
    (max == null || next <= max);
  const parsedInput = parseNumericInput(inputValue, allowDecimal, locale);
  const inputError =
    !disabled &&
    !readOnly &&
    touched &&
    (inputValue.trim() ? !isValidValue(parsedInput) : required);
  const validationText = inputError
    ? !inputValue.trim()
      ? "Enter a value."
      : parsedInput == null
        ? allowDecimal
          ? "Enter a valid number."
          : "Enter a whole number."
        : min != null && max != null
          ? `Enter ${min}–${max}.`
          : min != null && parsedInput < min
            ? `Enter ${min} or more.`
            : `Enter ${max} or less.`
    : undefined;
  const descriptionId = `${id}-helper`;
  const commit = (next: number | null) => {
    setInputValue(formatNumericInput(next, locale));
    onValueChange?.(next);
  };

  return (
    <FormControl
      fullWidth
      size={size}
      disabled={disabled}
      required={required}
      error={Boolean(error || inputError)}
      variant="outlined"
    >
      <FormLabel
        htmlFor={id}
        sx={{
          mb: 0.75,
          color: "text.primary",
          fontWeight: 500,
        }}
      >
        {label}
      </FormLabel>
      <Box sx={{ display: "flex" }}>
        <OutlinedInput
          id={id}
          inputRef={inputRef}
          value={inputValue}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={() => {
            focusedRef.current = true;
            // Grouping belongs to display formatting. Keeping separators in
            // an editable draft makes a single-digit deletion invalid.
            if (!readOnly) {
              const parsed = parseNumericInput(inputValue, allowDecimal, locale);
              if (parsed != null) {
                const draft = formatNumericInput(parsed, locale, false);
                if (draft !== inputValue) {
                  // Removing grouping must not replace the browser's caret or
                  // selection with a forced jump or select-all.
                  const input = inputRef.current;
                  if (input?.selectionStart != null && input.selectionEnd != null) {
                    const group = new Intl.NumberFormat(locale).formatToParts(12345)
                      .find((part) => part.type === "group")?.value;
                    const offset = (position: number) => Math.min(draft.length,
                      group ? inputValue.slice(0, position).split(group).join("").length : position);
                    selectionAfterFormatting.current = {
                      start: offset(input.selectionStart),
                      end: offset(input.selectionEnd),
                      direction: input.selectionDirection ?? "none",
                    };
                  }
                  setInputValue(draft);
                }
              }
            }
          }}
          onBlur={() => {
            focusedRef.current = false;
            setTouched(true);
            const parsed = parseNumericInput(inputValue, allowDecimal, locale);
            if (!inputValue.trim()) commit(null);
            else if (isValidValue(parsed)) commit(parsed);
          }}
          onChange={(event) => {
            const raw = event.target.value;
            setInputValue(raw);
            setTouched(true);
            const parsed = parseNumericInput(raw, allowDecimal, locale);
            onValueChange?.(
              !raw.trim() ? null : isValidValue(parsed) ? parsed : Number.NaN,
            );
          }}
          aria-describedby={
            validationText || helperText ? descriptionId : undefined
          }
          endAdornment={
            unit ? (
              <InputAdornment position="end">{unit}</InputAdornment>
            ) : undefined
          }
          slotProps={{
            input: {
              autoComplete: "off",
              inputMode: allowDecimal ? "decimal" : "numeric",
              enterKeyHint: "done",
              "aria-label": typeof label === "string" ? label : undefined,
            },
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 1,
            "& input": {
              textAlign: readOnly ? "left" : "right",
            },
          }}
        />
      </Box>
      {(validationText || helperText) && (
        <FormHelperText id={descriptionId}>
          {validationText || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
