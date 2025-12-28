import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  Box,
  IconButton,
  List,
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
import { MushroomTry, MushroomData, colorPalette } from "./types";
import { decodeEvent } from "./helpers";

const Timeline = () => {
  const { days, monthsWithEvents, selectedMonth, setSelectedMonth } =
    useSharedMushroomTries();

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

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
      setSelectedEvent({
        name: "",
        mush,
        health,
        startTime,
        endTime,
        pikminAp,
      });
      setFormKey(crypto.randomUUID());
      setShowMoreInfo(true);
    }
  };

  const handleAddNew = () => {
    setSelectedEvent(null);
    setInputEventId("");
    setFormKey(crypto.randomUUID());
    setShowMoreInfo(true);
  };

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: { xs: "auto", md: "85vh" },
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
                  borderBottom: 1,
                  borderColor: "divider",
                  px: 1,
                }}
              >
                <IconButton onClick={() => setShowMoreInfo(false)}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="subtitle1">Event</Typography>
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
                subheader={
                  <ListSubheader disableSticky sx={{ p: 0 }}>
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
                        {Object.entries(monthsWithEvents).map(
                          ([key, value]) => (
                            <MenuItem key={key} value={(value as any).key}>
                              {(value as any).label}
                            </MenuItem>
                          )
                        )}
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
                }
              >
                {days.map((day, i) => (
                  <React.Fragment key={day.date}>
                    <ListItemButton
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
                    <Collapse
                      in={expandedDays[day.date]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <List component="div" disablePadding>
                        {day.tries.map((mushEvent) => (
                          <ListItemButton
                            key={mushEvent.id}
                            sx={{ pl: 10, py: 0.25, minHeight: "auto" }}
                            onClick={() => {
                              setSelectedEvent(mushEvent);
                              setFormKey(crypto.randomUUID());
                              setShowMoreInfo(true);
                            }}
                          >
                            <ListItemText
                              primary={
                                mushEvent.name ||
                                mushEvent.mush?.label ||
                                "Untitled"
                              }
                              secondary={mushEvent.endTime.format("HH:mm")}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                ))}
              </List>
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
                subheader={
                  <ListSubheader disableSticky sx={{ p: 0 }}>
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
                        {Object.entries(monthsWithEvents).map(
                          ([key, value]) => (
                            <MenuItem key={key} value={(value as any).key}>
                              {(value as any).label}
                            </MenuItem>
                          )
                        )}
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
                }
              >
                {days.map((day, i) => (
                  <React.Fragment key={day.date}>
                    <ListItemButton
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
                    <Collapse
                      in={expandedDays[day.date]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <List component="div" disablePadding>
                        {day.tries.map((mushEvent) => (
                          <ListItemButton
                            key={mushEvent.id}
                            sx={{ pl: 10, py: 0.25, minHeight: "auto" }}
                            onClick={() => {
                              setSelectedEvent(mushEvent);
                              setFormKey(crypto.randomUUID());
                              setShowMoreInfo(true);
                            }}
                          >
                            <ListItemText
                              primary={
                                mushEvent.name ||
                                mushEvent.mush?.label ||
                                "Untitled"
                              }
                              secondary={mushEvent.endTime.format("HH:mm")}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                ))}
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
