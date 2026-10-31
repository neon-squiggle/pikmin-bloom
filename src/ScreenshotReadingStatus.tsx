import { Box, LinearProgress, Typography } from "@mui/material";
import { ScreenshotReadProgress } from "./useScreenshotReader";

const ScreenshotReadingStatus = ({
  progress,
  batch = false,
}: {
  progress: ScreenshotReadProgress | null;
  batch?: boolean;
}) =>
  !progress ? null : (
    <Box role="status">
      <Typography variant="body2" sx={{ mb: 1 }}>
        {batch
          ? `${progress.index + 1}/${progress.total} · ${progress.filename} · ${progress.message}`
          : progress.message}
      </Typography>
      <LinearProgress />
    </Box>
  );

export default ScreenshotReadingStatus;
