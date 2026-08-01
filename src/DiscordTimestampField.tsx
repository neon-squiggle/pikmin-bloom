import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { Dayjs } from "dayjs";

interface DiscordTimestampFieldProps {
  label: string;
  time: Dayjs | null;
}

const DiscordTimestampField = ({ label, time }: DiscordTimestampFieldProps) => {
  const timestamp = time?.isValid() ? `<t:${time.unix()}:f>` : "";
  if (!timestamp) return null;

  return (
    <Box sx={{ width: "fit-content", maxWidth: "100%" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        component="div"
        sx={{ mb: 0.5 }}
      >
        {label}
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          maxWidth: "100%",
          pl: 1.5,
          overflow: "hidden",
          bgcolor: "action.hover",
        }}
      >
        <Typography
          component="code"
          variant="body2"
          aria-label={label}
          sx={{ whiteSpace: "nowrap" }}
        >
          {timestamp}
        </Typography>
        <Tooltip title="Copy Discord timestamp" describeChild>
          <IconButton
            aria-label={`Copy ${label}`}
            onClick={() => navigator.clipboard.writeText(timestamp)}
            sx={{ width: 44, height: 44, ml: 0.5 }}
          >
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
};

export default DiscordTimestampField;
