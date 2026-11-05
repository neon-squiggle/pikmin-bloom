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
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MushroomTypeField from "./MushroomTypeField";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import useScreenshotReader from "./useScreenshotReader";
import ScreenshotFileInput from "./ScreenshotFileInput";
import FilePickerButton from "./FilePickerButton";
import ScreenshotReadingStatus from "./ScreenshotReadingStatus";
import AppNotice from "./AppNotice";
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
import ScreenshotPreview from "./ScreenshotPreview";

interface ReviewDraft extends ScreenshotDraft { file: File; manual?: boolean }

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
  draft: ReviewDraft;
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
  const needsReview = !validDraft(draft, finishes, timezone);
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
      data-needs-review={needsReview}
      component="section"
      aria-label={`Review ${draft.filename}`}
      expanded={expanded}
      onChange={(_, value) => setExpanded(value)}
      title={
        <Stack component="span" spacing={0.5} sx={{ minWidth: 0 }}>
          <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            {needsReview && <ErrorOutlineIcon color="error" fontSize="small" titleAccess="Needs review" sx={{ flexShrink: 0 }} />}
            <Typography component="span" variant="subtitle2" sx={{ overflowWrap: "anywhere", minWidth: 0 }}>
              {draft.title || draft.filename}
            </Typography>
          </Box>
          {draft.title && <Typography variant="caption" color="text.secondary">
            {draft.filename}
          </Typography>}
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
        <ScreenshotPreview file={draft.file} />
        {needsReview && draft.warnings.length > 0 && (
          <AppNotice severity="error" message={draft.warnings.join(" ")} />
        )}
        <TextField
          fullWidth
          required
          autoFocus={draft.manual}
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
  const input = useRef<HTMLInputElement>(null);
  const fileIds = useRef(new WeakMap<File, string>());
  const nextFileId = useRef(0);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const { reading, progress, pendingFiles, readFiles, cancel, dismissFile } =
    useScreenshotReader();
  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [errors, setErrors] = useState<Map<File, string>>(new Map());
  const invalidDraftCount = drafts.filter((draft) => !validDraft(draft, finishes, timezone)).length;
  const reviewCount = invalidDraftCount + (reading ? errors.size : pendingFiles.length);
  const reviewDescription = reviewCount === 1 ? "1 screenshot needs review" : `${reviewCount} screenshots need review`;
  const dismissPendingFile = (file: File) => {
    dismissFile(file);
    setErrors((previous) => {
      const next = new Map(previous);
      next.delete(file);
      return next;
    });
  };
  const upload = (files: File[], append: boolean) => {
    files.forEach((file) => {
      if (!fileIds.current.has(file)) fileIds.current.set(file, `screenshot-${Date.now()}-${nextFileId.current++}`);
    });
    setAnchor(null);
    if (!append) {
      setDrafts([]);
      setErrors(new Map());
    }
    setErrors((previous) => {
      const next = new Map(previous);
      files.forEach((file) => next.delete(file));
      return next;
    });
    setOpen(true);
    void readFiles(files, {
      includeIdentity: true,
      keepPending: append,
      onRead: (result, file) =>
        setDrafts((previous) => [
          ...previous,
          {
            id: fileIds.current.get(file)!,
            filename: file.name,
            file,
            title: result.title ?? "",
            type: result.mushroomType ?? "",
            capturedAt: result.capturedAt,
            countdown: result.countdown,
            warnings: result.warnings.filter(
              (warning) => !/\b(health|ap)\b/i.test(warning),
            ),
          },
        ]),
      onError: ({ timedOut, message, stage }, file) =>
        setErrors((previous) => new Map(previous).set(file,
          `${file.name}: ${timedOut ? "Reading took too long." : (message ?? "Could not read this screenshot.")} Stopped at: ${stage}`,
        )),
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
          title={reviewCount > 0 ? reviewDescription : undefined}
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
          {reviewCount > 0 && <ErrorOutlineIcon color="error" fontSize="small" titleAccess="Screenshots need review" />}
        </Fab>
      ) : (
        <Button
          aria-label="Add mushrooms"
          title={reviewCount > 0 ? reviewDescription : undefined}
          variant="contained"
          onClick={(event) => setAnchor(event.currentTarget)}
          startIcon={<AddIcon />}
          endIcon={reviewCount > 0 ? <ErrorOutlineIcon color="error" titleAccess="Screenshots need review" /> : undefined}
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
            aria-label="Resume screenshots"
            title={reviewCount > 0 ? reviewDescription : undefined}
            onClick={() => {
              setAnchor(null);
              setOpen(true);
            }}
          >
            {reviewCount > 0 && <ListItemIcon><ErrorOutlineIcon color="error" titleAccess="Screenshots need review" /></ListItemIcon>}
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
                setOpen(pendingFiles.length > 0);
              }}
            >
              Save {drafts.length || ""} mushrooms
            </Button>
          </>
        }
      >
        {reading && (
          <Box sx={{ mb: 2 }}>
            <ScreenshotReadingStatus progress={progress} batch reviewCount={reviewCount} />
          </Box>
        )}
        {!reading && pendingFiles.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                upload(pendingFiles, true);
              }}
            >
              Retry {pendingFiles.length}{" "}
              {pendingFiles.length === 1 ? "screenshot" : "screenshots"}
            </Button>
          </Box>
        )}
        {!reading && invalidDraftCount > 0 && (
          <AppNotice
            severity="error"
            message={invalidDraftCount === 1 ? "1 screenshot needs review" : `${invalidDraftCount} screenshots need review`}
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
        {pendingFiles.map((file) => (
          <Stack key={fileIds.current.get(file)} component="section" aria-label={`Unread ${file.name}`}
            spacing={1.5} sx={{ p: 2, mb: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {(!reading || errors.has(file)) && <ErrorOutlineIcon color="error" fontSize="small" titleAccess="Needs review" />}
              <Typography component="h3" variant="subtitle2" sx={{ overflowWrap: "anywhere", minWidth: 0 }}>{file.name}</Typography>
            </Box>
            <ScreenshotPreview file={file} />
            <Typography variant="body2" role={errors.has(file) ? "alert" : undefined}>
              {errors.get(file) ?? (reading ? "Waiting for screenshot reading." : "Not read yet. Reading stopped before this screenshot was completed.")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button disabled={reading} onClick={() => upload([file], true)}>Retry</Button>
              <Button disabled={reading} onClick={() => {
                setDrafts((previous) => [...previous, {
                  id: fileIds.current.get(file)!,
                  file, manual: true, filename: file.name, title: "", type: "", capturedAt: null, countdown: null,
                  warnings: [errors.get(file) ?? "Automatic reading did not finish. Enter the screenshot values below."],
                }]);
                dismissPendingFile(file);
              }}>Enter manually</Button>
              <Button disabled={reading} onClick={() => dismissPendingFile(file)}>Skip screenshot</Button>
            </Box>
          </Stack>
        ))}
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
