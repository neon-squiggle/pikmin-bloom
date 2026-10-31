import { forwardRef } from "react";

// Keep accepted formats and same-file retry behavior identical for both flows.
const ScreenshotFileInput = forwardRef<
  HTMLInputElement,
  {
    label: string;
    multiple?: boolean;
    disabled?: boolean;
    accept?: string;
    onFiles: (files: File[]) => void;
  }
>(function ScreenshotFileInput(
  {
    label,
    multiple = false,
    disabled = false,
    accept = "image/png,image/jpeg,image/webp",
    onFiles,
  },
  ref,
) {
  return (
    <input
      ref={ref}
      hidden
      aria-label={label}
      type="file"
      multiple={multiple}
      disabled={disabled}
      accept={accept}
      onChange={(event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (files.length) onFiles(files);
      }}
    />
  );
});

export default ScreenshotFileInput;
