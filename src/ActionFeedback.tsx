import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Box, IconButton, Snackbar, SnackbarContent, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { mobileNavigationHeight } from "./types";

export const noticeDuration = 5000;
const ActionFeedback = ({ message, action, onClose, noticeKey, aboveFab = false }: {
  message: string;
  action?: ReactNode;
  onClose?: () => void;
  noticeKey?: string | number;
  aboveFab?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const close = useCallback(() => {
    setOpen(false);
    closeRef.current?.();
  }, []);
  useEffect(() => {
    setOpen(true);
  }, [message, noticeKey]);
  if (!open) return null;
  return <Snackbar
    key={noticeKey ?? message}
    open
    autoHideDuration={noticeDuration}
    onClose={(_, reason) => { if (reason !== "clickaway") close(); }}
    sx={{ bottom: { xs: `calc(${mobileNavigationHeight + 16 + (aboveFab ? 56 : 0)}px + env(safe-area-inset-bottom))`, sm: 24 } }}
  >
    <SnackbarContent
      role="status"
      aria-atomic="true"
      sx={{ minWidth: 0, maxWidth: "100%", "& .MuiButton-root": { color: "inherit" }, "& .MuiSnackbarContent-message": { minWidth: 0, overflowWrap: "anywhere" } }}
      message={<Box>{message}</Box>}
      action={<Stack direction="row" alignItems="center" gap={0.5}>
        {action}
        <IconButton color="inherit" size="small" aria-label="Dismiss notification" onClick={close}><CloseIcon fontSize="small" /></IconButton>
      </Stack>}
    />
  </Snackbar>;
};
export default ActionFeedback;
