import React, { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import {
  Box,
  IconButton,
  List,
  Fab,
  ListSubheader,
  ListItemButton,
  ListItemText,
  Card,
  CardContent,
  Select,
  MenuItem,
  Collapse,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DateMonogram from "./DateMonogram";
import MoreInfo from "./MoreInfo";
import { useSharedMushroomTries } from "./Provider";
import { MushroomTry, MushroomData, colorPalette, navbarHeight } from "./types";
import { decodeEvent } from "./helpers";

const Timeline = () => {
  const { days, monthsWithEvents, selectedMonth, setSelectedMonth } =
    useSharedMushroomTries();

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const [selectedEvent, setSelectedEvent] = useState<MushroomTry | null>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [inputEventId, setInputEventId] = useState("");
  const [formKey, setFormKey] = useState<string>(crypto.randomUUID());

  const defaultExpandedDays = useMemo(
    () =>
      days.reduce((acc, day) => {
        acc[day.date] = true;
        return acc;
      }, {} as Record<string, boolean>),
    [days]
  );
  const [expandedDays, setExpandedDays] = useState(defaultExpandedDays);

  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const element = document.getElementById(`day-${today}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [days]);

  const handleToggleDay = (date: string) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const handleToggleAll = () => {
    const allExpanded = Object.values(expandedDays).every(Boolean);
    setExpandedDays(
      Object.fromEntries(
        Object.keys(expandedDays).map((k) => [k, !allExpanded])
      )
    );
  };

  const handleInputEvent = (value: string) => {
    setInputEventId(value);
    const decoded: MushroomData | null = decodeEvent(value);
    if (decoded) {
      const { mush, health, startTime, endTime, pikminAp } = decoded;
      const event: MushroomTry = {
        name: "",
        mush,
        health,
        startTime,
        endTime,
        pikminAp,
      };
      setSelectedEvent(event);
      openMoreInfo(event);
    }
  };

  const openMoreInfo = (event: MushroomTry | null = null) => {
    setSelectedEvent(event);
    setFormKey(crypto.randomUUID());
    setShowMoreInfo(true);
  };

  const handleAddNew = () => {
    setInputEventId("");
    openMoreInfo();
  };

  const listItems = days.map((day, i) => (
    <React.Fragment key={day.date}>
      <ListItemButton
        id={`day-${day.date}`}
        onClick={() => handleToggleDay(day.date)}
        disabled={day.tries.length === 0}
      >
        <DateMonogram
          day={dayjs(day.date).format("ddd")}
          date={dayjs(day.date).format("D")}
          color={colorPalette[i % colorPalette.length]}
        />
        <ListItemText
          primary={`${day.tries.length} mushroom${
            day.tries.length !== 1 ? "s" : ""
          }`}
          sx={{ ml: 1 }}
        />
        {expandedDays[day.date] && day.tries.length > 0 ? (
          <ExpandLess />
        ) : day.tries.length > 0 ? (
          <ExpandMore />
        ) : null}
      </ListItemButton>
      <Collapse in={expandedDays[day.date]} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {day.tries.map((mushEvent) => (
            <ListItemButton
              key={mushEvent.id}
              sx={{ pl: 10, py: 0.25, minHeight: "auto" }}
              onClick={() => {
                openMoreInfo(mushEvent);
              }}
            >
              <ListItemText
                primary={mushEvent.name || mushEvent.mush?.label || "Untitled"}
                secondary={mushEvent.endTime.format("HH:mm")}
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </React.Fragment>
  ));

  const subheader = (
    <ListSubheader
      sx={{
        p: 0,
        bgcolor: "background.paper",
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.051), rgba(255, 255, 255, 0.051))",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.25,
        }}
      >
        <Select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          sx={{ flex: 1 }}
        >
          {Object.entries(monthsWithEvents).map(([key, value]) => (
            <MenuItem key={key} value={(value as any).key}>
              {(value as any).label}
            </MenuItem>
          ))}
        </Select>
        <IconButton onClick={handleToggleAll} size="small">
          {Object.values(expandedDays).every(Boolean) ? (
            <UnfoldLessIcon />
          ) : (
            <UnfoldMoreIcon />
          )}
        </IconButton>
      </Box>
    </ListSubheader>
  );

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        maxHeight: `calc(100dvh - ${navbarHeight}px)`,
        minHeight: 0,
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {isSmall ? (
          showMoreInfo ? (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: 1,
                  borderColor: "divider",
                  px: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconButton onClick={() => setShowMoreInfo(false)}>
                    <ArrowBackIcon />
                  </IconButton>
                  <Typography variant="subtitle1">Event</Typography>
                </Box>
                <IconButton onClick={handleAddNew} aria-label="Add event">
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, mt: 2 }}>
                <MoreInfo
                  key={formKey}
                  mushEvent={selectedEvent}
                  onDelete={() => setShowMoreInfo(false)}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: "100%", overflowY: "auto", minHeight: 0 }}>
              <List
                component="nav"
                sx={{ width: "100%" }}
                subheader={subheader}
              >
                {listItems}
              </List>
              <Box
                sx={{
                  position: "fixed",
                  right: 16,
                  bottom: 16 + navbarHeight,
                  zIndex: (theme) => theme.zIndex.tooltip + 1,
                }}
              >
                <Fab color="primary" size="small" onClick={handleAddNew}>
                  <AddIcon />
                </Fab>
              </Box>
            </Box>
          )
        ) : (
          <>
            <Box
              sx={{
                width: { xs: "100%", md: "34%" },
                overflowY: "auto",
                minHeight: 0,
                flex: { xs: "0 0 auto", md: "0 0 34%" },
                flexShrink: 0,
                maxWidth: { md: "40%" },
              }}
            >
              <List
                component="nav"
                sx={{ width: "100%" }}
                subheader={subheader}
              >
                {listItems}
              </List>
            </Box>

            <Box
              sx={{
                flex: "1 1 0",
                flexDirection: "column",
                ml: { xs: 0, md: 2 },
                mt: { xs: 2, md: 0 },
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  minHeight: { xs: 56, md: 64 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  borderBottom: 1,
                  borderColor: "divider",
                  px: 2,
                  mb: 2,
                }}
              >
                <IconButton onClick={handleAddNew}>
                  <AddIcon />
                </IconButton>
              </Box>

              {showMoreInfo && (
                <MoreInfo
                  key={formKey}
                  mushEvent={selectedEvent}
                  onDelete={() => setShowMoreInfo(false)}
                />
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Timeline;
