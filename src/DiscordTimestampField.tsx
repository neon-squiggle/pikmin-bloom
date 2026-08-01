import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button } from "@mui/material";
import { Dayjs } from "dayjs";
import { useState } from "react";

interface DiscordTimestampFieldProps {
  label: string;
  time: Dayjs | null;
}

const DiscordTimestampField = ({ label, time }: DiscordTimestampFieldProps) => {
  const [copied, setCopied] = useState(false);
  const timestamp = time?.isValid() ? `<t:${time.unix()}:f>` : "";
  if (!timestamp) return null;

  const copyTimestamp = () => {
    navigator.clipboard.writeText(timestamp);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ContentCopyIcon fontSize="small" />}
        aria-label={`Copy ${label}`}
        onClick={copyTimestamp}
        sx={{ whiteSpace: "nowrap", minHeight: 36 }}
      >
        {copied ? "Copied" : "Timestamp"}
      </Button>
    </Box>
  );
};

export default DiscordTimestampField;
