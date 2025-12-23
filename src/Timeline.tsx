import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  IconButton,
  List,
  ListSubheader,
  ListItemButton,
  ListItemText,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  Collapse,
  Fab,
  TextField,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import AddIcon from "@mui/icons-material/Add";

import { MushroomTry, MushroomData } from "./types";
import { encodeEvent, decodeEvent } from "./helpers";
import DateMonogram from "./DateMonogram";
import MoreInfo from "./MoreInfo";
import { useSharedMushroomTries } from "./Provider";

const Timeline = () => {
  const { events, days, monthsWithEvents, selectedMonth, setSelectedMonth } =
    useSharedMushroomTries();
  const [selectedEvent, setSelectedEvent] = useState<MushroomTry | null>(null);
  const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false);
  const [inputEventId, setInputEventId] = useState<string>("");

  const defaultExpandedDays = useMemo(() => {
    return days.reduce((acc, day) => {
      acc[day.date] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, [days]);

  const [expandedDays, setExpandedDays] =
    useState<Record<string, boolean>>(defaultExpandedDays);

  useEffect(() => {
    setExpandedDays(defaultExpandedDays);
  }, [defaultExpandedDays]);

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
      setShowMoreInfo(true);
    }
  };

  const handleToggleDay = (date: string) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const handleToggleAll = () => {
    setExpandedDays((prev) => {
      const allExpanded = Object.values(prev).every(Boolean);
      return Object.fromEntries(
        Object.keys(prev).map((key) => [key, !allExpanded])
      );
    });
  };

  return (
    <Card
      variant="elevation"
      sx={{
        display: "flex",
        position: "relative",
        flexDirection: "row",
        height: "80vh",
      }}
    >
      <CardContent sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            width: 330,
            overflowY: "auto",
            minHeight: 0,
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
                    onChange={(e) => {
                      setSelectedEvent(null);
                      setInputEventId("");
                      setSelectedMonth(e.target.value);
                    }}
                    sx={{ flex: 1 }}
                  >
                    {Object.entries(monthsWithEvents).map(([key, value]) => (
                      <MenuItem key={key} value={value.key}>
                        {value.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <IconButton onClick={handleToggleAll} size="small">
                    {Object.values(expandedDays).every(
                      (day) => day === true
                    ) ? (
                      <UnfoldLessIcon />
                    ) : (
                      <UnfoldMoreIcon />
                    )}
                  </IconButton>
                </Box>
              </ListSubheader>
            }
          >
            {days.map((day) => (
              <>
                <ListItemButton onClick={() => handleToggleDay(day.date)}>
                  <DateMonogram
                    day={dayjs(day.date, "YYYY-MM-DD").format("ddd")}
                    date={dayjs(day.date, "YYYY-MM-DD").format("D")}
                  />
                  <ListItemText
                    primary={`${day.tries.length} mushroom${
                      day.tries.length !== 1 ? "s" : ""
                    }`}
                    sx={{ ml: 1 }}
                  />
                  {expandedDays[day.date] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse
                  in={expandedDays[day.date]}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {day.tries.map((mushEvent: MushroomTry) => (
                      <ListItemButton
                        sx={{ pl: 10, py: 0.25, minHeight: "auto" }}
                        onClick={() => {
                          setSelectedEvent(mushEvent);
                          setShowMoreInfo(true);
                        }}
                      >
                        <ListItemText
                          primary={
                            (mushEvent?.name || mushEvent?.mush?.label) ??
                            "Untitled"
                          }
                          secondary={mushEvent.endTime.format("HH:mm")}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ))}
          </List>
        </Box>
        <Box
          sx={{
            flex: 1,
            flexDirection: "column",
            ml: 2,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
          }}
        >
          <Box
            sx={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
              mb: 2,
            }}
          >
            <TextField
              label="input event ID"
              value={inputEventId}
              onChange={(event) => handleInputEvent(event.target.value)}
              sx={{ minWidth: 246 }}
            />
            <IconButton
              onClick={() => {
                setSelectedEvent(null);
                setInputEventId("");
                setShowMoreInfo(true);
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          {showMoreInfo && (
            <MoreInfo
              mushEvent={selectedEvent}
              onDelete={() => setShowMoreInfo(false)}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default Timeline;
