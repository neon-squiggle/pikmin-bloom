import { useLayoutEffect, useRef, useState } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Card,
  Paper,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { PlannerFinish } from "./stagePlanner";
import { PlannerCalculationRequest } from "./plannerCalculator";
import MushCalcRadio from "./MushCalcRadio";
import MushroomPlanner from "./MushroomPlanner";
import { mobileNavigationHeight, Mode } from "./types";
import useTabScrollRestoration from "./useTabScrollRestoration";

const View = ({ keyboardOpen = false }: { keyboardOpen?: boolean }) => {
  const [planningRequest, setPlanningRequest] =
    useState<PlannerCalculationRequest | null>(null);
  const [resumeDraft, setResumeDraft] = useState<PlannerFinish | null>(null);
  const [calculatedFinish, setCalculatedFinish] =
    useState<PlannerFinish | null>(null);
  const [mode, setMode] = useState<Mode>("calculator");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const handoffFocus = useRef(false);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const [initialCardHeight, setInitialCardHeight] = useState<number>();
  const selectMode = useTabScrollRestoration({
    value: mode, onChange: setMode, active: isMobile,
    // The planner initializes its first view to today in its own layout effect.
    initialPosition: () => mode === "calendar" ? window.scrollY : 0,
  });
  // Reselecting the current destination returns to its top.
  const changeMode = (value: Mode) => selectMode(value, value === mode);

  useLayoutEffect(() => {
    if (!handoffFocus.current) return;
    const panel = document.getElementById(
      mode === "calculator" ? "calculator-panel" : "calendar-panel",
    );
    panel?.focus({ preventScroll: true });
    handoffFocus.current = false;
  }, [mode]);

  useLayoutEffect(() => {
    const element = calculatorRef.current;
    if (!element) return;
    let measuredWidth = 0;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      // Keep the initial height at each width, ignoring later form expansion.
      if (width > 0 && height > 0 && width !== measuredWidth) {
        measuredWidth = width;
        setInitialCardHeight(height);
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      component={Card}
      sx={{
        width: { xs: "100%", md: "680px" },
        maxWidth: { md: "680px" },
        flexGrow: 1,
        minWidth: 0,
        position: "relative",
        overflow: { xs: "visible", sm: "hidden" },
      }}
    >
      {isMobile ? (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: 1,
            borderColor: "divider",
            pb: "env(safe-area-inset-bottom)",
            pl: "env(safe-area-inset-left)",
            pr: "env(safe-area-inset-right)",
            borderRadius: 0,
            display: keyboardOpen ? "none" : "block",
          }}
        >
          <BottomNavigation
            component="nav"
            aria-label="Main navigation"
            showLabels
            value={mode}
            onChange={(_, value: Mode) => changeMode(value)}
            sx={{ height: mobileNavigationHeight, background: "transparent" }}
          >
            <BottomNavigationAction
              id="calculator-tab"
              aria-controls="calculator-panel"
              aria-current={mode === "calculator" ? "page" : undefined}
              value="calculator"
              label="Calculator"
              icon={<CalculateIcon />}
            />
            <BottomNavigationAction
              id="calendar-tab"
              aria-controls="calendar-panel"
              aria-current={mode === "calendar" ? "page" : undefined}
              value="calendar"
              label="Planner"
              icon={<CalendarMonthIcon />}
            />
          </BottomNavigation>
        </Paper>
      ) : (
        <Tabs
          value={mode}
          onChange={(_, value: Mode) => changeMode(value)}
          variant="fullWidth"
          aria-label="Mushroom tools"
          sx={{ minHeight: 56, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            id="calculator-tab"
            aria-controls="calculator-panel"
            value="calculator"
            icon={<CalculateIcon />}
            iconPosition="start"
            label="Calculator"
            sx={{ minHeight: 56 }}
          />
          <Tab
            id="calendar-tab"
            aria-controls="calendar-panel"
            value="calendar"
            icon={<CalendarMonthIcon />}
            iconPosition="start"
            label="Planner"
            sx={{ minHeight: 56 }}
          />
        </Tabs>
      )}
      <Box
        tabIndex={-1}
        id="calculator-panel"
        role={isMobile ? "region" : "tabpanel"}
        aria-labelledby="calculator-tab"
        hidden={mode !== "calculator"}
        sx={
          mode !== "calculator"
            ? {
                // Keep the form measurable on resize without exposing hidden controls
                // or letting its expanded content enlarge the calendar page.
                display: "block",
                visibility: "hidden",
                position: "absolute",
                width: "100%",
                height: 0,
                overflow: "hidden",
              }
            : undefined
        }
      >
        <Box ref={calculatorRef}>
          <MushCalcRadio
            embedded
            planningRequest={planningRequest}
            onUsePlan={(finish) => {
              handoffFocus.current = true;
              setCalculatedFinish(finish);
              setPlanningRequest(null);
              changeMode("calendar");
            }}
            onCancelPlan={() => {
              handoffFocus.current = true;
              setResumeDraft(planningRequest?.finish ?? null);
              setPlanningRequest(null);
              changeMode("calendar");
            }}
          />
        </Box>
      </Box>
      <Box
        tabIndex={-1}
        id="calendar-panel"
        role={isMobile ? "region" : "tabpanel"}
        aria-labelledby="calendar-tab"
        hidden={mode !== "calendar"}
      >
        <MushroomPlanner
          embedded
          active={mode === "calendar"}
          initialHeight={initialCardHeight}
          calculatedFinish={calculatedFinish}
          resumeDraft={resumeDraft}
          onCalculate={(finish) => {
            handoffFocus.current = true;
            setResumeDraft(null);
            setPlanningRequest({ id: `${Date.now()}`, finish });
            selectMode("calculator", true);
          }}
        />
      </Box>
    </Box>
  );
};

export default View;
