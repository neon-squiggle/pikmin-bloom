import { useRef } from "react";
import { Button, ButtonProps } from "@mui/material";
import ScreenshotFileInput from "./ScreenshotFileInput";

// A native button activates the hidden picker with mouse, Enter, or Space.
const FilePickerButton = ({
  inputLabel,
  accept,
  multiple,
  onFiles,
  ...props
}: Omit<ButtonProps, "component" | "href" | "onClick"> & {
  inputLabel: string;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button {...props} onClick={() => input.current?.click()} />
      <ScreenshotFileInput
        ref={input}
        label={inputLabel}
        accept={accept}
        multiple={multiple}
        disabled={props.disabled}
        onFiles={onFiles}
      />
    </>
  );
};
export default FilePickerButton;
