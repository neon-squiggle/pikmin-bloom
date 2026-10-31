import { FormEvent, ReactNode } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// Both planner editing flows use the calculator's phone breakpoint and retain
// MUI's focus management. Callers own draft state, validation and submission.
const ResponsiveDialog = ({
  open,
  onClose,
  title,
  titleId,
  children,
  actions,
  maxWidth = "xs",
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  children: ReactNode;
  actions: ReactNode;
  maxWidth?: "xs" | "sm";
  onSubmit?: (event: FormEvent) => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isMobile}
      maxWidth={maxWidth}
      aria-labelledby={titleId}
      slotProps={
        onSubmit ? { paper: { component: "form", onSubmit } } : undefined
      }
    >
      <DialogTitle
        id={titleId}
        sx={{ pt: { xs: "max(16px, env(safe-area-inset-top))", sm: 2 } }}
      >
        {title}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions
        sx={{
          flexWrap: "wrap",
          px: 2,
          pb: { xs: "max(16px, env(safe-area-inset-bottom))", sm: 2 },
        }}
      >
        {actions}
      </DialogActions>
    </Dialog>
  );
};

export default ResponsiveDialog;
