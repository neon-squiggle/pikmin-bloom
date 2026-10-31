import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertColor,
  Box,
  IconButton,
  Stack,
  SxProps,
  Theme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Contextual warnings remain inline. Action results use ActionFeedback.
const AppNotice = ({
  message,
  severity = "info",
  action,
  children,
  onClose,
  noticeKey,
  sx,
}: {
  message: string;
  severity?: AlertColor;
  action?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  noticeKey?: string | number;
  sx?: SxProps<Theme>;
}) => {
  const [dismissed, setDismissed] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const close = useCallback(() => {
    setDismissed(true);
    closeRef.current?.();
  }, []);
  useEffect(() => {
    setDismissed(false);
  }, [message, severity, noticeKey]);
  if (dismissed) return null;
  return (
    <Alert
      severity={severity}
      variant="outlined"
      role={severity === "error" || severity === "warning" ? "alert" : "status"}
      aria-atomic="true"
      sx={[
        { minWidth: 0, "& .MuiAlert-message": { minWidth: 0, flex: 1, overflowWrap: "anywhere" } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      action={
        <IconButton color="inherit" size="small" aria-label="Dismiss notification" onClick={close}>
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      <Box>{message}</Box>
      {children}
      {action && (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
          {action}
        </Stack>
      )}
    </Alert>
  );
};
export default AppNotice;
