import React from "react";
import { ListItemAvatar, Avatar, Typography } from "@mui/material";

interface DateMonogramProps {
  day: string;
  date: string;
}

const DateMonogram = ({ day, date }: DateMonogramProps) => (
  <ListItemAvatar>
    <Avatar
      sx={{
        bgcolor: "primary.light",
        width: 48,
        height: 48,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 12,
      }}
    >
      <Typography variant="caption" sx={{ lineHeight: 1 }}>
        {day}
      </Typography>
      <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
        {date}
      </Typography>
    </Avatar>
  </ListItemAvatar>
);

export default DateMonogram;
