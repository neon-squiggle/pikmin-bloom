import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button, FormHelperText } from "@mui/material";
import { Dayjs } from "dayjs";
import { useState } from "react";

interface DiscordTimestampFieldProps {
  label: string;
  time: Dayjs | null;
}

const DiscordTimestampField = ({ label, time }: DiscordTimestampFieldProps) => {
  const [copyError, setCopyError] = useState(false);
  const timestamp = time?.isValid() ? `<t:${time.unix()}:f>` : "";
  if (!timestamp) return null;

  const copyTimestamp = async () => {
    try {
      await navigator.clipboard.writeText(timestamp);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        justifyContent: "flex-end",
        width: "100%",
      }}
    >
      <Button
        variant="text"
        size="small"
        startIcon={<ContentCopyIcon fontSize="small" />}
        aria-label={`Copy ${label}`}
        onClick={copyTimestamp}
        sx={{ whiteSpace: "nowrap", minHeight: { xs: 44, sm: 36 } }}
      >
        Copy Discord time
      </Button>
      {copyError && <>
        <FormHelperText error role="alert" sx={{ width: "100%", textAlign: "right" }}>
          Copy failed. Select the timestamp below to copy it manually.
        </FormHelperText>
        <Box component="code" tabIndex={0} aria-label="Discord timestamp" sx={{ width: "100%", userSelect: "all", overflowWrap: "anywhere", textAlign: "right" }}>{timestamp}</Box>
      </>}
    </Box>
  );
};

export default DiscordTimestampField;
