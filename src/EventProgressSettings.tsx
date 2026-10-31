import { useEffect, useState } from "react";
import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { EventProgress, eventStep } from "./stagePlanner";
import NumberSpinner from "./NumberSpinner";

const EventProgressSettings = ({
  progress,
  onChange,
}: {
  progress?: EventProgress;
  onChange: (value?: EventProgress) => void;
}) => {
  const [stage, setStage] = useState(progress?.stage ?? 1);
  const [step, setStep] = useState(progress?.step ?? 1);
  const [counted, setCounted] = useState(progress?.counted ?? 0);
  useEffect(() => {
    setStage(progress?.stage ?? 1);
    setStep(progress?.step ?? 1);
    setCounted(progress?.counted ?? 0);
  }, [progress]);
  const validStage = Number.isInteger(stage) && stage >= 1 && stage <= 999;
  const quota = validStage ? eventStep(stage, step).mushrooms : 0;
  const save = (nextStage: number, nextStep: number, nextCounted: number) => {
    if (
      !Number.isInteger(nextStage) ||
      nextStage < 1 ||
      nextStage > 999 ||
      !Number.isInteger(nextCounted) ||
      nextCounted < 0 ||
      nextCounted > eventStep(nextStage, nextStep).mushrooms
    )
      return;
    // Numeric fields also commit on blur. Do not move the cutoff without an edit.
    if (
      nextStage === (progress?.stage ?? 1) &&
      nextStep === (progress?.step ?? 1) &&
      nextCounted === (progress?.counted ?? 0)
    )
      return;
    onChange({
      stage: nextStage,
      step: nextStep,
      counted: nextCounted,
      asOf: new Date(Date.now()).toISOString(),
    });
  };
  return (
    <Stack role="group" aria-label="Event progress" spacing={2.5}>
      <Typography component="h4" variant="subtitle2">
        Event progress
      </Typography>
      <NumberSpinner
        label="Stage"
        value={stage}
        min={1}
        max={999}
        allowDecimal={false}
        onValueChange={(value) => {
          const next = value ?? Number.NaN;
          const nextCounted = next === stage ? counted : 0;
          setStage(next);
          setCounted(nextCounted);
          save(next, step, nextCounted);
        }}
      />
      <TextField
        select
        fullWidth
        label="Step"
        value={step}
        onChange={(event) => {
          const next = Number(event.target.value);
          setStep(next);
          setCounted(0);
          save(stage, next, 0);
        }}
      >
        {[1, 2, 3, 4].map((number) => (
          <MenuItem key={number} value={number} sx={{ whiteSpace: "normal" }}>
            Step {number}
            {validStage
              ? ` · ${eventStep(stage, number).tasks.join(" · ")}`
              : ""}
          </MenuItem>
        ))}
      </TextField>
      {quota > 0 && (
        <NumberSpinner
          label="Mushrooms already counted"
          unit={`/ ${quota}`}
          value={counted}
          min={0}
          max={quota}
          allowDecimal={false}
          onValueChange={(value) => {
            const next = value ?? Number.NaN;
            setCounted(next);
            save(stage, step, next);
          }}
        />
      )}
      <Typography variant="body2" color="text.secondary">
        Changes start from now. Earlier endings stay in End times.
      </Typography>
      {progress && (
        <Button
          color="inherit"
          sx={{ alignSelf: "flex-start" }}
          onClick={() => onChange(undefined)}
        >
          Reset progress
        </Button>
      )}
    </Stack>
  );
};

export default EventProgressSettings;
