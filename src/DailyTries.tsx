import { useId, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { PlannerFinish } from "./stagePlanner";
import { hypotheticalCount, hypotheticalDays } from "./hypotheticalTries";

dayjs.extend(utc);
const DailyTries = ({
  finishes,
  timezone,
  eventMonth,
  now,
  onClear,
}: {
  finishes: PlannerFinish[];
  timezone: string;
  eventMonth: string;
  now: number;
  onClear: () => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [extraDays, setExtraDays] = useState(0);
  const days = hypotheticalDays(finishes, timezone, now, eventMonth, extraDays);
  const close = () => setOpen(false);
  const paperProps = {
    id,
    role: "dialog",
    "aria-modal": true as const,
    "aria-labelledby": `${id}-title`,
  };
  const content = (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h2" variant="h6" id={`${id}-title`}>
          Daily tries
        </Typography>
        <IconButton aria-label="Close daily tries" onClick={close}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box
        component="ul"
        aria-label="Daily free tries"
        sx={{
          display: "grid",
          m: 0,
          p: 0,
          listStyle: "none",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 1,
        }}
      >
        {days.map((date) => {
          const used = hypotheticalCount(date, finishes, timezone);
          const label = `${dayjs.utc(date).format("MMM D")} · ${used}/3`;
          return (
            <Chip
              key={date}
              component="li"
              aria-label={label}
              label={label}
              color={used >= 3 ? "success" : "primary"}
              variant="outlined"
              sx={{ minHeight: 44 }}
            />
          );
        })}
      </Box>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        <Button
          size="small"
          color="inherit"
          onClick={() => setExtraDays((value) => value + 7)}
          disabled={
            days[days.length - 1] ===
            dayjs.utc(`${eventMonth}-01`).endOf("month").format("YYYY-MM-DD")
          }
        >
          Show more start dates
        </Button>
        {extraDays > 0 && (
          <Button size="small" color="inherit" onClick={() => setExtraDays(0)}>
            Show fewer start dates
          </Button>
        )}
      </Stack>
      <Button
        color="inherit"
        onClick={onClear}
        disabled={!finishes.some((finish) => finish.source === "hypothetical")}
        sx={{ alignSelf: "flex-start" }}
      >
        Clear daily tries
      </Button>
    </Stack>
  );
  return (
    <>
      <Button
        ref={anchor}
        color="inherit"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(true)}
        sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
      >
        Daily tries
      </Button>
      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={close}
          slotProps={{
            paper: {
              ...paperProps,
              sx: {
                maxHeight: "75dvh",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                pb: "env(safe-area-inset-bottom)",
              },
            },
          }}
        >
          {content}
        </Drawer>
      ) : (
        <Popover
          open={open}
          anchorEl={anchor.current}
          onClose={close}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: { ...paperProps, sx: { width: 380, maxHeight: "75dvh" } },
          }}
        >
          {content}
        </Popover>
      )}
    </>
  );
};
export default DailyTries;
