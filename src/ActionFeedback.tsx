import { createContext, ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { Box, IconButton, Snackbar, SnackbarContent, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { mobileNavigationHeight } from "./types";

export const noticeDuration = 5000;
const FeedbackContext = createContext<{
  active: string | null;
  show: (id: string) => void;
  clear: (id: string) => void;
  fabPresent: boolean;
  setFabPresent: (present: boolean) => void;
} | null>(null);

export const ActionFeedbackProvider = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState<string | null>(null);
  const [fabPresent, setFabPresent] = useState(false);
  const show = useCallback((id: string) => setActive(id), []);
  const clear = useCallback((id: string) => setActive(previous => previous === id ? null : previous), []);
  const value = useMemo(() => ({ active, show, clear, fabPresent, setFabPresent }), [active, show, clear, fabPresent]);
  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
};

// Keep the primary action stationary; mobile snackbars appear above it.
export const useFeedbackFab = (present: boolean) => {
  const setFabPresent = useContext(FeedbackContext)?.setFabPresent;
  useEffect(() => {
    setFabPresent?.(present);
    return () => setFabPresent?.(false);
  }, [present, setFabPresent]);
};

const ActionFeedback = ({ message, action, children, onClose, noticeKey, severity = "success" }: {
  message: string;
  action?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  noticeKey?: string | number;
  severity?: "success" | "error" | "info";
}) => {
  const id = useId();
  const context = useContext(FeedbackContext);
  const show = context?.show;
  const clear = context?.clear;
  const [open, setOpen] = useState(true);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const close = useCallback(() => {
    setOpen(false);
    clear?.(id);
    closeRef.current?.();
  }, [clear, id]);
  useEffect(() => {
    setOpen(true);
    show?.(id);
    return () => clear?.(id);
  }, [id, message, noticeKey, show, clear]);
  if (!open || (context && context.active !== id)) return null;
  return <Snackbar
    key={noticeKey ?? message}
    open
    autoHideDuration={noticeDuration}
    onClose={(_, reason) => { if (reason !== "clickaway") close(); }}
    sx={{ bottom: { xs: `calc(${mobileNavigationHeight + 16 + (context?.fabPresent ? 56 : 0)}px + env(safe-area-inset-bottom))`, sm: 24 } }}
  >
    <SnackbarContent
      role={severity === "error" ? "alert" : "status"}
      aria-atomic="true"
      sx={{ minWidth: 0, maxWidth: "100%", "& .MuiButton-root": { color: "inherit" }, "& .MuiSnackbarContent-message": { minWidth: 0, overflowWrap: "anywhere" } }}
      message={<Box>{message}{children}</Box>}
      action={<Stack direction="row" alignItems="center" gap={0.5}>
        {action}
        <IconButton color="inherit" size="small" aria-label="Dismiss notification" onClick={close}><CloseIcon fontSize="small" /></IconButton>
      </Stack>}
    />
  </Snackbar>;
};
export default ActionFeedback;
