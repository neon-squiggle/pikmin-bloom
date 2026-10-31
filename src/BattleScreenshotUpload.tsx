import { useEffect, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";

import { BattleScreenshotResult } from "./readBattleScreenshot";
import useScreenshotReader from "./useScreenshotReader";
import FilePickerButton from "./FilePickerButton";
import ScreenshotReadingStatus from "./ScreenshotReadingStatus";
import ActionFeedback from "./ActionFeedback";

const BattleScreenshotUpload = ({
  onRead,
  onBusyChange,
}: {
  onRead: (result: BattleScreenshotResult) => void;
  onBusyChange: (busy: boolean) => void;
}) => {
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");
  const { reading, progress, pendingFiles, readFiles, cancel } =
    useScreenshotReader();
  useEffect(() => onBusyChange(reading), [reading, onBusyChange]);

  const upload = (files: File[]) => {
    setError("");
    setFilename("");
    void readFiles(files.slice(0, 1), {
      onRead: (result, file) => {
        onRead(result);
        setFilename(file.name);
      },
      onError: ({ timedOut, message }) =>
        setError(
          timedOut
            ? "Reading took too long. Try again, or enter the values manually."
            : (message ??
                "Couldn't read this screenshot. Try again or enter the values manually."),
        ),
    });
  };

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <FilePickerButton
          inputLabel="Upload battle screenshot"
          onFiles={upload}
          variant="outlined"
          startIcon={<AddPhotoAlternateOutlinedIcon />}
          disabled={reading}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Upload screenshot
        </FilePickerButton>
        {reading && <Button onClick={cancel}>Cancel</Button>}
        {!reading && pendingFiles.length > 0 && (
          <Button onClick={() => upload(pendingFiles)}>Retry screenshot</Button>
        )}
      </Box>
      <ScreenshotReadingStatus progress={progress} />
      {error && <ActionFeedback severity="error" message={error} onClose={() => setError("")} />}
      {filename && (
        <ActionFeedback message={`Screenshot loaded: ${filename}`} onClose={() => setFilename("")} />
      )}
    </Stack>
  );
};

export default BattleScreenshotUpload;
