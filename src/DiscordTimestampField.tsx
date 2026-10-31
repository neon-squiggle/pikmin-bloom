import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, FormHelperText, IconButton, Tooltip } from "@mui/material";
import { Dayjs } from "dayjs";
import { ReactNode, useState } from "react";
import ActionFeedback from "./ActionFeedback";

interface DiscordTimestampFieldProps {
  label: string;
  time: Dayjs | null;
  children: ReactNode;
}

// Keep each field's copy action alongside it and any error underneath.
const DiscordTimestampField = ({ label, time, children }: DiscordTimestampFieldProps) => {
  const [copyError, setCopyError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyRevision, setCopyRevision] = useState(0);
  const timestamp = time?.isValid() ? `<t:${time.unix()}:f>` : "";

  const copyTimestamp = async () => {
    try {
      await navigator.clipboard.writeText(timestamp);
      setCopyError(false);
      setCopyRevision((revision) => revision + 1);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "flex-start", justifyContent: "flex-end" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
        <Tooltip title="Copy Discord time">
          <span>
            <IconButton aria-label={`Copy ${label}`} disabled={!timestamp} onClick={copyTimestamp}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      {timestamp && copyError && <>
        <FormHelperText error role="alert">
          Copy failed. Select the timestamp below to copy it manually.
        </FormHelperText>
        <Box component="code" tabIndex={0} aria-label="Discord timestamp" sx={{ display: "block", userSelect: "all", overflowWrap: "anywhere" }}>{timestamp}</Box>
      </>}
      {copied && <ActionFeedback message="Copied" noticeKey={copyRevision} onClose={() => setCopied(false)} />}
    </Box>
  );
};

export default DiscordTimestampField;
