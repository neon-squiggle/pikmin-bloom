import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button } from "@mui/material";
import { Dayjs } from "dayjs";
import { useState } from "react";
import ActionFeedback from "./ActionFeedback";

interface DiscordTimestampFieldProps {
  label: string;
  time: Dayjs | null;
}

const DiscordTimestampField = ({ label, time }: DiscordTimestampFieldProps) => {
  const [copyError, setCopyError] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyRevision, setCopyRevision] = useState(0);
  const timestamp = time?.isValid() ? `<t:${time.unix()}:f>` : "";
  if (!timestamp) return null;

  const copyTimestamp = async () => {
    setCopyRevision((revision) => revision + 1);
    try {
      await navigator.clipboard.writeText(timestamp);
      setManualCopy(false);
      setCopied(true);
      setCopyError(false);
    } catch {
      setManualCopy(true);
      setCopyError(true);
      setCopied(false);
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
      {copied && (
        <ActionFeedback
          message="Copied"
          severity="success"
          noticeKey={copyRevision}
          onClose={() => setCopied(false)}
        />
      )}
      {copyError && (
        <ActionFeedback
          message="Copy failed. The timestamp is available beside the copy button."
          severity="error"
          noticeKey={copyRevision}
          onClose={() => setCopyError(false)}
        />
      )}
      {manualCopy && <Box component="code" tabIndex={0} aria-label="Discord timestamp" sx={{ width: "100%", userSelect: "all", overflowWrap: "anywhere", textAlign: "right" }}>{timestamp}</Box>}
    </Box>
  );
};

export default DiscordTimestampField;
