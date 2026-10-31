import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  localDateTime,
  PlannerFinish,
  PlannerState,
  projectStages,
} from "./stagePlanner";
import { projectionMonth } from "./hypotheticalTries";
import { finishTimings, nextLocalMidnight } from "./plannerTiming";
import { mergeImportedFinishes, mergeManualFinish } from "./plannerRecords";
import DailyTries from "./DailyTries";
import CalendarScreenshotUpload from "./CalendarScreenshotUpload";
import PlannerFinishEditor from "./PlannerFinishEditor";
import PlannerFinishRow from "./PlannerFinishRow";
import PlannerSettings from "./PlannerSettings";
import PlannerChangeFeedback from "./PlannerChangeFeedback";
import ActionFeedback from "./ActionFeedback";
import { mobileNavigationHeight } from "./types";
import usePlannerState from "./usePlannerState";
import { mergePlannerChanges } from "./plannerPersistence";
import useTabScrollRestoration from "./useTabScrollRestoration";

const formatStep = (id: string) => id.replace("-", "–");
const MushroomPlanner = ({
  initialHeight,
  onCalculate,
  calculatedFinish,
  resumeDraft,
  active = true,
  embedded = false,
}: {
  initialHeight?: number;
  active?: boolean;
  embedded?: boolean;
  onCalculate?: (finish: PlannerFinish) => void;
  calculatedFinish?: PlannerFinish | null;
  resumeDraft?: PlannerFinish | null;
}) => {
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [state, setState, storageError, latestState, retrySave] =
    usePlannerState(browserZone);
  const [now, setNow] = useState(Date.now);
  const [editing, setEditing] = useState<PlannerFinish | null>(null);
  const [undo, setUndo] = useState<{
    before: PlannerState;
    after: PlannerState;
    message: string;
    noticeKey: number;
  } | null>(null);
  const feedbackSequence = useRef(0);
  const consumedCalculation = useRef<PlannerFinish | null>(null);
  const [view, setView] = useState("stages");
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const pageScroll = useMediaQuery(theme.breakpoints.down("sm"));
  const eventMonth =
    state.selectedMonth ?? projectionMonth(now, state.timezone, state.finishes);
  const progress = state.eventProgress[eventMonth];
  const eventFinishes = useMemo(
    () =>
      state.finishes.filter((finish) =>
        localDateTime(Date.parse(finish.endAt), state.timezone).startsWith(
          eventMonth,
        ),
      ),
    [state.finishes, state.timezone, eventMonth],
  );
  const plan = useMemo(
    () => projectStages(eventFinishes, now, progress),
    [eventFinishes, now, progress],
  );
  const timing = useMemo(
    () => finishTimings(plan.rows, state, { month: eventMonth, progress }),
    [plan.rows, state, eventMonth, progress],
  );
  const ordered = useMemo(
    () =>
      [...eventFinishes].sort(
        (a, b) =>
          Date.parse(a.endAt) - Date.parse(b.endAt) || a.id.localeCompare(b.id),
      ),
    [eventFinishes],
  );
  const commit = useCallback(
    (next: PlannerState, message: string) => {
      const before = latestState.current;
      setState(next);
      setUndo({ before, after: next, message, noticeKey: ++feedbackSequence.current });
    },
    [setState, latestState],
  );
  const saveFinish = useCallback(
    (finish: PlannerFinish) => {
      const previous = latestState.current;
      commit(
        { ...previous, finishes: mergeManualFinish(previous.finishes, finish) },
        "Mushroom saved",
      );
    },
    [commit, latestState],
  );
  useEffect(() => {
    if (calculatedFinish && consumedCalculation.current !== calculatedFinish) {
      consumedCalculation.current = calculatedFinish;
      saveFinish(calculatedFinish);
    }
  }, [calculatedFinish, saveFinish]);
  useEffect(() => {
    if (resumeDraft) setEditing(resumeDraft);
  }, [resumeDraft]);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const next = Math.min(
      nextLocalMidnight(now, state.timezone),
      ...state.finishes
        .map((finish) => Date.parse(finish.endAt))
        .filter((end) => end > now),
    );
    const timer = window.setTimeout(
      refresh,
      Math.max(0, Math.min(next - Date.now() + 20, 2147483647)),
    );
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [state.finishes, state.timezone, now]);
  const today = localDateTime(now, state.timezone).slice(0, 10);
  const changeView = useTabScrollRestoration({
    value: view,
    onChange: setView,
    active,
    pageScroll,
    containerRef: contentRef,
    scope: `${state.timezone}:${eventMonth}:${today}`,
    initialPosition: () => {
      const container = contentRef.current;
      const target = container?.querySelector<HTMLElement>(
        `[data-finish-date="${today}"]`,
      );
      if (!container || !target) return 0;
      const offset = (toolbarRef.current?.getBoundingClientRect().height ?? 48) + 12;
      return Math.max(0, pageScroll
        ? window.scrollY + target.getBoundingClientRect().top - offset
        : container.scrollTop + target.getBoundingClientRect().top - container.getBoundingClientRect().top - offset);
    },
  });
  const focusFinish = (id?: string) => {
    window.requestAnimationFrame(() => {
      const target = Array.from(
        contentRef.current?.querySelectorAll<HTMLElement>("[data-edit-id]") ??
          [],
      ).find((element) => element.dataset.editId === id);
      target?.focus({ preventScroll: true });
    });
  };
  const closeEditor = () => {
    const id = editing?.id;
    setEditing(null);
    focusFinish(id);
  };
  const renderFinish = (finish: PlannerFinish, showStep = false) => (
    <PlannerFinishRow
      key={finish.id}
      finish={finish}
      now={now}
      timezone={state.timezone}
      timing={timing.get(finish.id)}
      showStep={showStep}
      onEdit={setEditing}
    />
  );
  const changedMonth = undo?.after.finishes
    .filter(
      (finish) =>
        !undo.before.finishes.some(
          (before) => before.id === finish.id && before.endAt === finish.endAt,
        ),
    )
    .map((finish) =>
      localDateTime(Date.parse(finish.endAt), state.timezone).slice(0, 7),
    )
    .sort()
    .find((month) => month !== eventMonth);
  const undoChange = () => {
    if (!undo) return;
    const restored = {
      ...latestState.current,
      finishes: mergePlannerChanges(
        undo.after,
        undo.before,
        latestState.current,
      ).finishes,
    };
    setState(restored);
    setUndo(null);
  };
  return (
    <Card
      ref={contentRef}
      elevation={embedded ? 0 : 1}
      sx={{
        ...(embedded && {
          borderRadius: 0,
          bgcolor: "transparent",
          backgroundImage: "none",
        }),
        width: "100%",
        // The two layouts have different heights; browser anchoring must not
        // shift the explicit per-tab restoration after React replaces a panel.
        overflowAnchor: "none",
        overflow: { xs: "visible", sm: "auto" },
        height: { xs: "auto", sm: initialHeight },
        minHeight: {
          xs: `calc(100dvh - ${mobileNavigationHeight + 16}px - env(safe-area-inset-bottom))`,
          sm: 0,
        },
      }}
    >
      <CardHeader
        slotProps={{ title: { component: "h1" } }}
        title="Mushroom planner"
        subheader={`${new Intl.DateTimeFormat(undefined, { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${eventMonth}-01T12:00:00Z`))}${state.timezone !== browserZone ? ` · ${state.timezone}` : ""}`}
      />
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
        Mushrooms are deduped based on name and type, last write wins.
      </Typography>
      {undo && (
          <PlannerChangeFeedback
            message={undo.message}
            noticeKey={undo.noticeKey}
            month={changedMonth}
            onUndo={undoChange}
            onDismiss={() => setUndo(null)}
            onViewMonth={(month) =>
              setState((previous) => ({ ...previous, selectedMonth: month }))
            }
          />
      )}
      <CardContent
        sx={{
          pt: 0,
          pb: { xs: 12, sm: 2 },
          "&:last-child": { pb: { xs: 12, sm: 2 } },
          minHeight: 0,
        }}
      >
        <Box
          component={Paper}
          elevation={1}
          square
          ref={toolbarRef}
          role="toolbar"
          aria-label="Planner controls"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            minHeight: 48,
            boxShadow: "none",
            borderBottom: 1,
            borderColor: "divider",
            mb: 1,
          }}
        >
          <Tabs
            value={view}
            onChange={(_, value) => changeView(value)}
            aria-label="Planner view"
            sx={{
              minWidth: 0,
              "& .MuiTab-root": {
                minWidth: 80,
                px: 1.5,
              },
            }}
          >
            <Tab
              id="planner-stages-tab"
              aria-controls="planner-stages"
              value="stages"
              label="Stages"
            />
            <Tab
              id="planner-finishes-tab"
              aria-controls="planner-finishes"
              value="finishes"
              label="End times"
            />
          </Tabs>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <DailyTries
              key={`${state.timezone}-${eventMonth}`}
              eventMonth={eventMonth}
              now={now}
              finishes={state.finishes}
              timezone={state.timezone}
              onClear={() =>
                commit(
                  {
                    ...latestState.current,
                    finishes: latestState.current.finishes.filter(
                      (finish) => finish.source !== "hypothetical",
                    ),
                  },
                  "Daily tries cleared",
                )
              }
            />
            <CalendarScreenshotUpload
              active={active}
              onManualAdd={() =>
                setEditing({
                  id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  title: "",
                  type: "",
                  endAt: new Date(Date.now()).toISOString(),
                  source: "manual",
                  status: "running",
                })
              }
              finishes={state.finishes}
              timezone={state.timezone}
              onSave={(result) =>
                commit(
                  { ...latestState.current, finishes: result.finishes },
                  "Mushrooms saved",
                )
              }
            />
          </Box>
        </Box>
        <Box
          role="tabpanel"
          id={`planner-${view}`}
          aria-labelledby={`planner-${view}-tab`}
        >
          {eventFinishes.length === 0 && !progress && (
            <Typography color="text.secondary" sx={{ my: 3 }}>
              No mushrooms yet
            </Typography>
          )}
          {view === "finishes" ? (
            <List disablePadding aria-label="Mushroom end times">
              {Array.from(
                new Set(
                  ordered.map((finish) =>
                    localDateTime(
                      Date.parse(finish.endAt),
                      state.timezone,
                    ).slice(0, 10),
                  ),
                ),
              ).map((day) => (
                <Box component="li" key={day} sx={{ listStyle: "none", mb: 2 }}>
                  <Typography
                    component="h2"
                    variant="subtitle1"
                    sx={{ borderBottom: 1, borderColor: "divider", py: 1 }}
                  >
                    {new Intl.DateTimeFormat(undefined, {
                      timeZone: "UTC",
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(`${day}T12:00:00Z`))}
                  </Typography>
                  <List disablePadding>
                    {ordered
                      .filter((finish) =>
                        localDateTime(
                          Date.parse(finish.endAt),
                          state.timezone,
                        ).startsWith(day),
                      )
                      .map((finish) => renderFinish(finish, true))}
                  </List>
                </Box>
              ))}
            </List>
          ) : eventFinishes.length > 0 || progress ? (
            <>
              {Array.from(new Set(plan.rows.map((row) => row.stage))).map(
                (stage) => (
                  <Box
                    component="section"
                    key={stage}
                    aria-label={`Stage ${stage}`}
                    sx={{ mb: 3 }}
                  >
                    <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
                      Stage {stage}
                    </Typography>
                    {plan.rows
                      .filter((row) => row.stage === stage)
                      .map((row) => (
                        <Box
                          component="section"
                          key={row.id}
                          aria-label={`Step ${formatStep(row.id)}`}
                          sx={{
                            borderTop: row.mushrooms ? 1 : 0,
                            borderColor: "divider",
                            py: row.mushrooms ? 2 : 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: row.mushrooms
                                ? "auto minmax(0, 1fr) auto"
                                : "auto minmax(0, 1fr)",
                              columnGap: { xs: 1, sm: 2 },
                              alignItems: "baseline",
                            }}
                          >
                            <Typography
                              component="h3"
                              variant="subtitle2"
                              color={
                                row.mushrooms
                                  ? "text.primary"
                                  : "text.secondary"
                              }
                            >
                              Step {formatStep(row.id)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {row.tasks.join(" · ")}
                            </Typography>
                            {row.mushrooms > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textAlign: "right" }}
                              >
                                {row.creditedCount + row.finishes.length}/
                                {row.mushrooms} mushrooms
                                {row.presumedComplete ? " · Complete" : ""}
                              </Typography>
                            )}
                          </Box>
                          {row.finishes.length > 0 && (
                            <List
                              component="ol"
                              disablePadding
                              aria-label={`Mushrooms for step ${formatStep(row.id)}`}
                            >
                              {row.finishes.map((finish) =>
                                renderFinish(finish),
                              )}
                            </List>
                          )}
                          {row.mushrooms >
                            row.creditedCount + row.finishes.length && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 1 }}
                            >
                              {row.mushrooms -
                                row.creditedCount -
                                row.finishes.length}{" "}
                              more{" "}
                              {row.mushrooms -
                                row.creditedCount -
                                row.finishes.length ===
                              1
                                ? "mushroom"
                                : "mushrooms"}{" "}
                              needed
                            </Typography>
                          )}
                        </Box>
                      ))}
                  </Box>
                ),
              )}
              {eventFinishes.some((finish) => finish.missed) && (
                <Box
                  component="section"
                  aria-label="Mushrooms excluded from stages"
                  sx={{ mb: 3 }}
                >
                  <Typography variant="subtitle2">Excluded from stages</Typography>
                  <List disablePadding>
                    {ordered
                      .filter((finish) => finish.missed)
                      .map((finish) => renderFinish(finish))}
                  </List>
                </Box>
              )}
            </>
          ) : null}
        </Box>
        <Box
          role="tabpanel"
          hidden
          id={`planner-${view === "stages" ? "finishes" : "stages"}`}
          aria-labelledby={`planner-${view === "stages" ? "finishes" : "stages"}-tab`}
        />
        <PlannerSettings
          storageError={storageError}
          onRetry={retrySave}
          state={state}
          month={eventMonth}
          onChange={(changes) =>
            setState((previous) => ({ ...previous, ...changes }))
          }
          onImport={(imported) =>
            commit(
              {
                ...latestState.current,
                finishes: mergeImportedFinishes(
                  latestState.current.finishes,
                  imported,
                ),
              },
              "Plans combined",
            )
          }
        />
        {storageError && (
          <ActionFeedback severity="error" message="Changes could not be saved on this device." noticeKey={undo?.noticeKey} />
        )}
      </CardContent>
      {editing && (
        <PlannerFinishEditor
          key={editing.id}
          finish={editing}
          timezone={state.timezone}
          eventMonth={eventMonth}
          types={state.finishes.map((finish) => finish.type)}
          isNew={!state.finishes.some((finish) => finish.id === editing.id)}
          onCalculate={
            onCalculate
              ? (finish) => {
                  setEditing(null);
                  onCalculate(finish);
                }
              : undefined
          }
          onClose={closeEditor}
          onSave={(finish) => {
            saveFinish(finish);
            closeEditor();
          }}
          onRemove={(finish) => {
            commit(
              {
                ...latestState.current,
                finishes: latestState.current.finishes.filter(
                  (record) => record.id !== finish.id,
                ),
              },
              "Mushroom removed",
            );
            closeEditor();
          }}
        />
      )}
    </Card>
  );
};
export default MushroomPlanner;
