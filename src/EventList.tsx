import React from "react";
import dayjs from "dayjs";
import {
  List,
  ListItemButton,
  ListItemText,
  Collapse,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import DateMonogram from "./DateMonogram";
import { MushroomEvent, colorPalette } from "./types";

interface DayWithEvents {
  date: string;
  tries: MushroomEvent[];
}

interface EventListProps {
  days: DayWithEvents[];
  expandedDays: Record<string, boolean>;
  onToggleDay: (date: string) => void;
  onSelectEvent: (event: MushroomEvent) => void;
  subheader?: React.ReactNode;
}

const EventList = ({
  days,
  expandedDays,
  onToggleDay,
  onSelectEvent,
  subheader,
}: EventListProps) => (
  <List component="nav" sx={{ width: "100%" }} subheader={subheader}>
    {days.map((day, i) => (
      <React.Fragment key={day.date}>
        <ListItemButton
          id={`day-${day.date}`}
          onClick={() => onToggleDay(day.date)}
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

export default EventList;
