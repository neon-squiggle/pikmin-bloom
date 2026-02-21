import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Collapse,
  Box,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";

import DateMonogram from "./DateMonogram";
import { MushroomEvent, colorPalette } from "./types";

interface DayWithEvents {
  date: string;
  tries: MushroomEvent[];
}

interface MonthOption {
  key: string;
  label: string;
}

interface EventListProps {
  days: DayWithEvents[];
  months: MonthOption[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onSelectEvent: (event: MushroomEvent) => void;
}

const EventList = ({
  days,
  months,
  selectedMonth,
  onMonthChange,
  onSelectEvent,
}: EventListProps) => {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Reset expanded state when days change (e.g., month switch)
  useEffect(() => {
    setExpandedDays(Object.fromEntries(days.map((day) => [day.date, true])));
  }, [days]);

  // Scroll to first upcoming event when days change
  useEffect(() => {
    const now = dayjs();
    const dayWithUpcoming = days.find((day) =>
      day.tries.some((event) => event.endTime.isAfter(now))
    );
    const targetDate = dayWithUpcoming?.date ?? now.format("YYYY-MM-DD");
    document.getElementById(`day-${targetDate}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [days]);

  const handleToggleDay = (date: string) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const allExpanded = Object.keys(expandedDays).length > 0 &&
    Object.values(expandedDays).every(Boolean);

  const handleToggleAll = () => {
    setExpandedDays(Object.fromEntries(
      Object.keys(expandedDays).map((k) => [k, !allExpanded])
    ));
  };

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
          onChange={(e) => onMonthChange(e.target.value)}
          sx={{ flex: 1 }}
        >
          {months.map(({ key, label }) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </Select>
        <IconButton onClick={handleToggleAll} size="small">
          {allExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
        </IconButton>
      </Box>
    </ListSubheader>
  );

  return (
    <List component="nav" sx={{ width: "100%" }} subheader={subheader}>
      {days.map((day, i) => (
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
              primary={`${day.tries.length} mushroom${day.tries.length !== 1 ? "s" : ""}`}
              sx={{ ml: 1 }}
            />
            {day.tries.length > 0 &&
              (expandedDays[day.date] ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
          <Collapse in={expandedDays[day.date]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {day.tries.map((event) => (
                <ListItemButton
                  key={event.id}
                  sx={{ pl: 10, py: 0.25, minHeight: "auto" }}
                  onClick={() => onSelectEvent(event)}
                >
                  <ListItemText
                    primary={event.name || event.mush?.label || "Untitled"}
                    secondary={event.endTime.format("HH:mm")}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
};

export default EventList;
