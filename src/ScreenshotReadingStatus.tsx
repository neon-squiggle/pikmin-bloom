import { Box, LinearProgress, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { ScreenshotReadProgress } from "./useScreenshotReader";

// Keep the sweep on the compositor while image matching occupies the main
// thread. Animating left/right would require layout work on every frame.
const sweep = keyframes`
  from { transform: translate3d(-100%, 0, 0); }
  to { transform: translate3d(250%, 0, 0); }
`;

const ScreenshotReadingStatus = ({
  progress,
  batch = false,
  reviewCount = 0,
}: {
  progress: ScreenshotReadProgress | null;
  batch?: boolean;
  reviewCount?: number;
}) => {
  if (!progress) return null;
  // The active file's zero-based index is the number already processed,
  // including earlier failures. The active file is not processed yet.
  const processed = progress.index;
  return (
    <Box role="status">
      <LinearProgress
        aria-label={batch ? "Reading screenshots" : "Reading screenshot"}
        variant={batch ? "determinate" : "indeterminate"}
        value={batch ? (processed / progress.total) * 100 : undefined}
        aria-valuetext={batch ? `${processed} of ${progress.total} screenshots processed` : undefined}
        sx={{
          "& .MuiLinearProgress-bar1Determinate": {
            transition: "transform 350ms ease-out",
            willChange: "transform",
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
              willChange: "auto",
            },
          },
          "& .MuiLinearProgress-bar1Indeterminate": {
            left: 0,
            right: "auto",
            width: "40%",
            transition: "none",
            willChange: "transform",
            animation: `${sweep} 1.6s linear infinite`,
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
              transform: "translateX(75%)",
              willChange: "auto",
            },
          },
          "& .MuiLinearProgress-bar2Indeterminate": { display: "none" },
        }}
      />
      {batch && <Typography variant="body2" sx={{ mt: 1 }}>
        {processed}/{progress.total} processed · {reviewCount} {reviewCount === 1 ? "needs" : "need"} review
      </Typography>}
      <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>
        {batch
          ? `${progress.filename} · ${progress.message}`
          : progress.message}
      </Typography>
    </Box>
  );
};

export default ScreenshotReadingStatus;
