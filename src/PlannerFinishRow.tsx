import {
  Box,
  Chip,
  IconButton,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  isPlannedMushroom,
  localDateTime,
  PlannerFinish,
} from "./stagePlanner";
import { FinishTiming } from "./plannerTiming";
import { formatPlannerDateTime } from "./plannerDateTime";

const statusChipSx = { height: 24, fontSize: "0.75rem" };

const PlannerFinishRow = ({
  finish,
  now,
  timezone,
  onEdit,
  timing,
  showStep = false,
}: {
  finish: PlannerFinish;
  now: number;
  timezone: string;
  onEdit: (finish: PlannerFinish) => void;
  timing?: FinishTiming;
  showStep?: boolean;
}) => {
  const date = new Date(finish.endAt);
  const planned = isPlannedMushroom(finish);
  const past = Date.parse(finish.endAt) <= now;
  const fullTime = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(date);
  return (
    <ListItem
      aria-label={finish.title}
      data-finish-date={localDateTime(date.valueOf(), timezone).slice(0, 10)}
      sx={{
        px: 0,
        scrollMarginTop: "72px",
        py: 1.5,
        display: "grid",
        gridTemplateColumns: {
          xs: "88px minmax(0, 1fr) 44px",
          sm: "130px minmax(0, 1fr) 44px",
        },
        gap: 1,
      }}
    >
      <Tooltip title={fullTime}>
        <Box
          component="time"
          dateTime={finish.endAt}
          aria-label={fullTime}
          sx={{ fontVariantNumeric: "tabular-nums", alignSelf: "start" }}
        >
          {!showStep && (
            <Typography
              component="span"
              sx={{ display: "block", fontWeight: 600 }}
            >
              {new Intl.DateTimeFormat(undefined, {
                timeZone: timezone,
                month: "short",
                day: "numeric",
              }).format(date)}
            </Typography>
          )}
          <Typography component="span" variant="body1" color="text.secondary">
            {new Intl.DateTimeFormat(undefined, {
              timeZone: timezone,
              hour: "numeric",
              minute: "2-digit",
            }).format(date)}
          </Typography>
        </Box>
      </Tooltip>
      <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        <Typography>{finish.title}</Typography>
        {finish.type && (
          <Typography variant="body2" color="text.secondary">
            {finish.type}
          </Typography>
        )}
        {showStep && timing && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            Step {timing.step.replace("-", "–")}
          </Typography>
        )}
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
          {(timing?.sleepRisk || timing?.shortGap) && (
            <Tooltip
              title={
                timing.sleepRisk
                  ? "Too little awake time to reach this task"
                  : `Only ${Math.round(timing.gapMinutes ?? 0)} min to reach this task`
              }
            >
              <Chip
                color="warning"
                label="May be missed"
                size="small"
                variant="outlined"
                sx={statusChipSx}
              />
            </Tooltip>
          )}
          {finish.missed && (
            <Chip
              label="Excluded from stages"
              size="small"
              variant="outlined"
              sx={{ ...statusChipSx, maxWidth: "100%" }}
            />
          )}
          {planned && !past && (
            <Chip
              size="small"
              variant="outlined"
              label="Planned"
              sx={statusChipSx}
            />
          )}
          {finish.usesFreeTry === false && (
            <Chip
              label="Mushroom ticket"
              size="small"
              variant="outlined"
              sx={statusChipSx}
            />
          )}
        </Stack>
        {planned && finish.startAt && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            Start time: {formatPlannerDateTime(finish.startAt, timezone)}
          </Typography>
        )}
        {past && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Ended
          </Typography>
        )}
      </Box>
      <Tooltip title="Edit mushroom">
        <IconButton
          data-edit-id={finish.id}
          aria-label={`Edit ${finish.title}`}
          onClick={() => onEdit(finish)}
          sx={{ width: 44, height: 44 }}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </ListItem>
  );
};

export default PlannerFinishRow;
