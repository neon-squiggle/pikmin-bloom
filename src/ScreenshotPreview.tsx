import { useEffect, useId, useState } from "react";
import { Box, Button } from "@mui/material";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import ResponsiveDialog from "./ResponsiveDialog";

// Files and object URLs stay in this review session, never in saved planner data.
const ScreenshotPreview = ({ file }: { file: File }) => {
  const [url, setUrl] = useState<string>();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  useEffect(() => {
    if (!URL.createObjectURL) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (!url) return null;
  return <>
    <Button startIcon={<ZoomInOutlinedIcon />} aria-label={`View screenshot ${file.name}`}
      onClick={() => setOpen(true)} sx={{ alignSelf: "flex-start" }}>View screenshot</Button>
    <ResponsiveDialog open={open} onClose={() => setOpen(false)}
      title={file.name} titleId={titleId} maxWidth="sm"
      actions={<>
        <Button component="a" href={url} target="_blank" rel="noopener noreferrer">Open full size</Button>
        <Button onClick={() => setOpen(false)}>Close preview</Button>
      </>}>
      <Box component="a" href={url} target="_blank" rel="noopener noreferrer"
        aria-label={`Open full-size screenshot ${file.name}`} sx={{ display: "block", cursor: "zoom-in" }}>
        <Box component="img" src={url} alt={`Screenshot ${file.name}`}
          sx={{ display: "block", width: "100%", height: "auto", maxHeight: "calc(100dvh - 180px)", objectFit: "contain" }} />
      </Box>
    </ResponsiveDialog>
  </>;
};

export default ScreenshotPreview;
