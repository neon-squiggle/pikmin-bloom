import React from "react";
import { ListItemAvatar, Avatar, Typography } from "@mui/material";

interface DateMonogramProps {
  day: string;
  date: string;
  color: string;
}

const DateMonogram = ({ day, date, color }: DateMonogramProps) => (
  <ListItemAvatar>
    <Avatar
      sx={{
        bgcolor: color,
        width: { xs: 40, sm: 48 },
        height: { xs: 40, sm: 48 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: { xs: 11, sm: 12 },
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
