import { useRef, useState } from "react";
import {
  Box,
  Button,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SectionAccordion from "./SectionAccordion";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MushroomTypeField from "./MushroomTypeField";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import useScreenshotReader from "./useScreenshotReader";
import ScreenshotFileInput from "./ScreenshotFileInput";
import FilePickerButton from "./FilePickerButton";
import ScreenshotReadingStatus from "./ScreenshotReadingStatus";
import AppNotice from "./AppNotice";
import ActionFeedback, { useFeedbackFab } from "./ActionFeedback";
import {
  draftFinishTime,
  mergeScreenshotDrafts,
  ScreenshotDraft,
  screenshotTryDay,
} from "./calendarScreenshotImport";
import { matchExistingBattle, mushroomIdentity } from "./plannerRecords";
import {
  localDateTime,
  PlannerFinish,
  selectedFinishTime,
} from "./stagePlanner";
import { parseTimeRemaining } from "./helpers";
import PlannerFinishField from "./PlannerFinishField";
import CountdownFields from "./CountdownFields";
import { mobileNavigationHeight } from "./types";
import ResponsiveDialog from "./ResponsiveDialog";
import { formatPlannerDateTime } from "./plannerDateTime";
import PlannerTryDateField from "./PlannerTryDateField";
import { validTryDate } from "./hypotheticalTries";

const validDraft = (draft: ScreenshotDraft, finishes: PlannerFinish[], timezone: string) => {
  const tryDay = screenshotTryDay(draft, finishes);
  return draftFinishTime(draft) != null &&
    Date.parse(draft.capturedAt!) <= Date.now() + 300000 &&
    Boolean(draft.countdown && parseTimeRemaining(draft.countdown)) &&
    validTryDate(tryDay) &&
    (!tryDay || tryDay <= localDateTime(Date.parse(draft.capturedAt!), timezone).slice(0, 10));
};

const ReviewRow = ({
  draft,
  finishes,
  matchesExisting,
  timezone,
  onChange,
  onSkip,
}: {
  draft: ScreenshotDraft;
  finishes: PlannerFinish[];
  matchesExisting: boolean;
  timezone: string;
  onChange: (changes: Partial<ScreenshotDraft>) => void;
  onSkip: () => void;
}) => {
  const [expanded, setExpanded] = useState(
    !validDraft(draft, finishes, timezone) || draft.warnings.length > 0,
  );
  const [capture, setCapture] = useState(() =>
    draft.capturedAt
      ? localDateTime(Date.parse(draft.capturedAt), timezone)
      : "",
  );
  const [occurrence, setOccurrence] = useState(
    draft.capturedAt ? String(Date.parse(draft.capturedAt)) : "",
  );
  const end = draftFinishTime(draft);
  const countdownError =
    !draft.countdown || !parseTimeRemaining(draft.countdown);
  const setCaptureTime = (wallTime: string, choice: string) => {
    const instant = selectedFinishTime(wallTime, timezone, choice);
    onChange({
      capturedAt: instant == null ? null : new Date(instant).toISOString(),
    });
  };
  return (
    <SectionAccordion
      headingLevel="h3"
      data-needs-review={!validDraft(draft, finishes, timezone)}
      component="section"
      aria-label={`Review ${draft.filename}`}
      expanded={expanded}
      onChange={(_, value) => setExpanded(value)}
      title={
        <Stack component="span" spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography component="span" variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
            {draft.title || draft.filename}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {draft.type}
            {end != null ? ` · ${formatPlannerDateTime(end, timezone)}` : ""}
          </Typography>
          {matchesExisting && (
            <Typography variant="caption" color="text.secondary">
              Update existing
            </Typography>
          )}
        </Stack>
      }
    >
      <Stack spacing={2}>
        {draft.warnings.length > 0 && (
          <AppNotice severity="warning" message={draft.warnings.join(" ")} />
        )}
        <TextField
          fullWidth
          required
          label="Title"
          error={!draft.title.trim()}
          helperText={!draft.title.trim() ? "Enter a title." : undefined}
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <MushroomTypeField
          showErrors
          value={draft.type}
          types={finishes.map((finish) => finish.type)}
          onChange={(type) => onChange({ type })}
        />
        <PlannerFinishField
          label="Screenshot captured at"
          timezone={timezone}
          value={capture}
          occurrence={occurrence}
          validationMessage={
            !draft.capturedAt
              ? "Enter screenshot capture time."
              : Date.parse(draft.capturedAt) > Date.now() + 300000
                ? "Capture time must not be in the future."
                : undefined
          }
          onChange={(value) => {
            setCapture(value);
            setOccurrence("");
            setCaptureTime(value, "");
          }}
          onOccurrenceChange={(value) => {
            setOccurrence(value);
            if (value) setCaptureTime(capture, value);
          }}
        />
        <Box
          component="fieldset"
          data-countdown-error={Boolean(countdownError)}
          sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}
        >
          <Typography component="legend" variant="body2" sx={{ mb: 1.5 }}>
            Countdown at capture
          </Typography>
          <CountdownFields
            value={
              draft.countdown ?? {
                days: null,
                hours: null,
                minutes: null,
                seconds: null,
              }
            }
            onChange={(unit, value) =>
              onChange({
                countdown: {
                  days: 0,
                  hours: 0,
                  minutes: 0,
                  seconds: 0,
                  ...draft.countdown,
                  [unit]: value ?? 0,
                },
              })
            }
          />
          {countdownError && (
            <Typography role="alert" variant="caption" color="error">
              Enter time remaining.
            </Typography>
          )}
        </Box>
        <PlannerTryDateField
          value={screenshotTryDay(draft, finishes)}
          maxDate={draft.capturedAt ? localDateTime(Date.parse(draft.capturedAt), timezone).slice(0, 10) : undefined}
          maxDateMessage="Choose a date on or before screenshot capture."
          onChange={(tryDay) => onChange({ tryDay })}
        />
        <Button onClick={onSkip} sx={{ alignSelf: "flex-start" }}>
          Skip screenshot
        </Button>
      </Stack>
    </SectionAccordion>
  );
};

const CalendarScreenshotUpload = ({
  finishes,
  timezone,
  onSave,
  onManualAdd,
  active = true,
}: {
  finishes: PlannerFinish[];
  timezone: string;
  active?: boolean;
  onManualAdd?: () => void;
  onSave: (result: ReturnType<typeof mergeScreenshotDrafts>) => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  useFeedbackFab(isMobile && active);
  const input = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const { reading, progress, pendingFiles, readFiles, cancel } =
    useScreenshotReader();
  const [drafts, setDrafts] = useState<ScreenshotDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const upload = (files: File[], append: boolean) => {
    setAnchor(null);
    if (!append) {
      setDrafts([]);
      setErrors([]);
    }
    setOpen(true);
    void readFiles(files, {
      includeIdentity: true,
      keepPending: append,
      onRead: (result, file, index) =>
        setDrafts((previous) => [
          ...previous,
          {
            id: `screenshot-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
            filename: file.name,
            title: result.title ?? "",
            type: result.mushroomType ?? "",
            capturedAt: result.capturedAt,
            countdown: result.countdown,
            warnings: result.warnings.filter(
              (warning) => !/\b(health|ap)\b/i.test(warning),
            ),
          },
        ]),
      onError: ({ timedOut, message }, file) =>
        setErrors((previous) => [
          ...previous,
          `${file.name}: ${timedOut ? "Reading took too long." : (message ?? "Could not read this screenshot.")}`,
        ]),
    });
  };
  const close = () => {
    cancel();
    setOpen(false);
  };
  return (
    <>
      <ScreenshotFileInput
        ref={input}
        label="Add mushroom screenshots"
        multiple
        onFiles={(files) =>
          upload(files, drafts.length > 0 || pendingFiles.length > 0)
        }
      />
      {isMobile ? (
        <Fab
          className="screenshot-fab"
          aria-label="Add mushrooms"
          onClick={(event) => setAnchor(event.currentTarget)}
          variant="extended"
          color="primary"
          sx={{
            position: "fixed",
            bottom: `calc(${mobileNavigationHeight + 16}px + env(safe-area-inset-bottom))`,
            right: "max(16px, env(safe-area-inset-right))",
            zIndex: theme.zIndex.appBar - 1,
            gap: 1,
          }}
        >
          <AddIcon />
          Add mushrooms
        </Fab>
      ) : (
        <Button
          variant="contained"
          onClick={(event) => setAnchor(event.currentTarget)}
          startIcon={<AddIcon />}
          sx={{ whiteSpace: "nowrap" }}
        >
          Add mushrooms
        </Button>
      )}
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            input.current?.click();
          }}
        >
          <ListItemIcon>
            <AddPhotoAlternateOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Upload screenshots</ListItemText>
        </MenuItem>
        {(drafts.length > 0 || pendingFiles.length > 0) && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              setOpen(true);
            }}
          >
            Resume screenshots
          </MenuItem>
        )}
        {onManualAdd && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onManualAdd();
            }}
          >
            <ListItemIcon>
              <EditOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Add manually</ListItemText>
          </MenuItem>
        )}
      </Menu>
      <ResponsiveDialog
        open={open}
        onClose={close}
        maxWidth="sm"
        title="Review screenshots"
        titleId="screenshot-review-title"
        actions={
          <>
            {reading ? (
              <Button onClick={cancel}>Stop reading</Button>
            ) : (
              <FilePickerButton
                inputLabel="Choose more mushroom screenshots"
                multiple
                onFiles={(files) => upload(files, true)}
              >
                Add more screenshots
              </FilePickerButton>
            )}
            <Button onClick={close}>Cancel</Button>
            <Button
              variant="contained"
              disabled={
                reading ||
                !drafts.length ||
                drafts.some((draft) => !validDraft(draft, finishes, timezone))
              }
              onClick={() => {
                onSave(mergeScreenshotDrafts(finishes, drafts));
                setDrafts([]);
                setErrors([]);
                setOpen(false);
              }}
            >
              Save {drafts.length || ""} mushrooms
            </Button>
          </>
        }
      >
        {reading && (
          <Box sx={{ mb: 2 }}>
            <ScreenshotReadingStatus progress={progress} batch />
          </Box>
        )}
        {!reading && pendingFiles.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                setErrors([]);
                upload(pendingFiles, true);
              }}
            >
              Retry {pendingFiles.length}{" "}
              {pendingFiles.length === 1 ? "screenshot" : "screenshots"}
            </Button>
          </Box>
        )}
        {!reading && drafts.some((draft) => !validDraft(draft, finishes, timezone)) && (
          <AppNotice
            severity="error"
            message={`${drafts.filter((draft) => !validDraft(draft, finishes, timezone)).length} screenshots need review`}
            sx={{ mb: 2 }}
            action={
              <Button
                onClick={() => {
                  const row = document.querySelector<HTMLElement>(
                    '[data-needs-review="true"]',
                  );
                  const summary =
                    row?.querySelector<HTMLElement>("[aria-expanded]");
                  if (summary?.getAttribute("aria-expanded") === "false")
                    summary.click();
                  window.requestAnimationFrame(() => {
                    const target =
                      row?.querySelector<HTMLElement>(
                        'input[aria-invalid="true"], [data-countdown-error="true"] input',
                      ) ?? row?.querySelector<HTMLElement>("input");
                    target?.focus();
                    target?.scrollIntoView?.({
                      block: "nearest",
                      behavior: "auto",
                    });
                  });
                }}
              >
                Review
              </Button>
            }
          />
        )}
        {errors.length > 0 && (
          <ActionFeedback severity="error"
            message={errors.length === 1 ? errors[0] : `${errors.length} screenshots could not be read. Retry the pending screenshots.`}
            noticeKey={errors.length} onClose={() => setErrors([])} />
        )}
        {drafts.map((draft, index) => (
          <ReviewRow
            key={draft.id}
            draft={draft}
            finishes={finishes}
            timezone={timezone}
            matchesExisting={
              matchExistingBattle(finishes, draft.title, draft.type).length >
                0 ||
              drafts
                .slice(0, index)
                .some(
                  (record) =>
                    mushroomIdentity(record.title, record.type) ===
                    mushroomIdentity(draft.title, draft.type),
                )
            }
            onChange={(changes) =>
              setDrafts((previous) =>
                previous.map((record) =>
                  record.id === draft.id ? { ...record, ...changes } : record,
                ),
              )
            }
            onSkip={() =>
              setDrafts((previous) =>
                previous.filter((record) => record.id !== draft.id),
              )
            }
          />
        ))}
        {!reading && !drafts.length && (
          <Typography sx={{ my: 2 }}>No screenshots ready to save.</Typography>
        )}
      </ResponsiveDialog>
    </>
  );
};

export default CalendarScreenshotUpload;
