import { useState } from "react";
import {
  Box,
  IconButton,
  Fab,
  Card,
  CardContent,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import EventList from "./EventList";
import MoreInfo from "./MoreInfo";
import { useSharedMushroomTries } from "./Provider";
import { MushroomEvent, navbarHeight } from "./types";

const Timeline = () => {
  const { days, monthsWithEvents, selectedMonth, setSelectedMonth } =
    useSharedMushroomTries();

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const [selectedEvent, setSelectedEvent] = useState<MushroomEvent | null>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [formKey, setFormKey] = useState(crypto.randomUUID());

  const openMoreInfo = (event: MushroomEvent | null = null) => {
    setSelectedEvent(event);
    setFormKey(crypto.randomUUID());
    setShowMoreInfo(true);
  };

  const closeMoreInfo = () => setShowMoreInfo(false);

  const eventList = (
    <EventList
      days={days}
      months={monthsWithEvents}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      onSelectEvent={openMoreInfo}
    />
  );

  const moreInfoPanel = (
    <MoreInfo
      key={formKey}
      mushEvent={selectedEvent}
      onDelete={closeMoreInfo}
    />
  );

  if (isSmall) {
    return (
      <Card sx={{ height: `calc(100dvh - ${navbarHeight}px)`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <CardContent sx={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column", overflow: "hidden" }}>
          {showMoreInfo ? (
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
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
                  <IconButton onClick={closeMoreInfo}>
                    <ArrowBackIcon />
                  </IconButton>
                  <Typography variant="subtitle1">Event</Typography>
                </Box>
                <IconButton onClick={() => openMoreInfo()} aria-label="Add event">
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, mt: 2 }}>
                {moreInfoPanel}
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: "100%", flex: 1, overflowY: "auto", minHeight: 0 }}>
              {eventList}
              <Box
                sx={{
                  position: "fixed",
                  right: 16,
                  bottom: 16 + navbarHeight,
                  zIndex: (theme) => theme.zIndex.tooltip + 1,
                }}
              >
                <Fab color="primary" size="small" onClick={() => openMoreInfo()}>
                  <AddIcon />
                </Fab>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "row",
        maxHeight: `calc(100dvh - ${navbarHeight}px)`,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "row", overflow: "hidden" }}>
        <Box
          sx={{
            width: "34%",
            overflowY: "auto",
            minHeight: 0,
            flexShrink: 0,
            maxWidth: "40%",
          }}
        >
          {eventList}
        </Box>

        <Box
          sx={{
            flex: "1 1 0",
            flexDirection: "column",
            ml: 2,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            width: "100%",
          }}
        >
          <Box
            sx={{
              minHeight: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
              mb: 2,
            }}
          >
            <IconButton onClick={() => openMoreInfo()}>
              <AddIcon />
            </IconButton>
          </Box>

          {showMoreInfo && moreInfoPanel}
        </Box>
      </CardContent>
    </Card>
  );
};

export default Timeline;
