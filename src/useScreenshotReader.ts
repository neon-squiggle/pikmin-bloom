import { useEffect, useRef, useState } from "react";
import {
  BattleScreenshotResult,
  readBattleScreenshot,
} from "./readBattleScreenshot";

export const SCREENSHOT_READ_TIMEOUT_MS = 90_000;

export interface ScreenshotReadProgress {
  message: string;
  filename: string;
  index: number;
  total: number;
}

interface ReadCallbacks {
  includeIdentity?: boolean;
  keepPending?: boolean;
  onRead: (result: BattleScreenshotResult, file: File, index: number) => void;
  onError: (
    failure: { timedOut: boolean; message?: string },
    file: File,
  ) => void;
}

// One reader owns one queue. Replacing, canceling or unmounting invalidates its
// callbacks, even if the underlying reader finishes after cancellation.
const useScreenshotReader = () => {
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<ScreenshotReadProgress | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const active = useRef<AbortController>();

  useEffect(
    () => () => {
      active.current?.abort();
      active.current = undefined;
    },
    [],
  );

  const cancel = () => active.current?.abort();
  const readFiles = async (files: File[], callbacks: ReadCallbacks) => {
    if (!files.length) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setPendingFiles((previous) =>
      callbacks.keepPending
        ? Array.from(new Set([...previous, ...files]))
        : files,
    );
    setReading(true);
    try {
      for (let index = 0; index < files.length; index++) {
        if (controller.signal.aborted) break;
        const file = files[index];
        const isCurrent = () =>
          active.current === controller && !controller.signal.aborted;
        const updateProgress = (message: string) => {
          if (isCurrent())
            setProgress({
              message,
              filename: file.name,
              index,
              total: files.length,
            });
        };
        updateProgress("Opening screenshot…");
        let timedOut = false;
        let rejectCanceled: () => void;
        const canceled = new Promise<never>((_, reject) => {
          rejectCanceled = () =>
            reject(new DOMException("Canceled", "AbortError"));
          controller.signal.addEventListener("abort", rejectCanceled, {
            once: true,
          });
        });
        const timeout = window.setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, SCREENSHOT_READ_TIMEOUT_MS);
        try {
          const result = await Promise.race([
            readBattleScreenshot(
              file,
              controller.signal,
              updateProgress,
              callbacks.includeIdentity,
            ),
            canceled,
          ]);
          if (isCurrent()) {
            callbacks.onRead(result, file, index);
            setPendingFiles((previous) =>
              previous.filter((pending) => pending !== file),
            );
          }
        } catch (error) {
          if (
            active.current === controller &&
            (!controller.signal.aborted || timedOut)
          ) {
            callbacks.onError(
              {
                timedOut,
                message: error instanceof Error ? error.message : undefined,
              },
              file,
            );
          }
        } finally {
          window.clearTimeout(timeout);
          controller.signal.removeEventListener("abort", rejectCanceled!);
        }
      }
    } finally {
      if (active.current === controller) {
        active.current = undefined;
        setReading(false);
        setProgress(null);
      }
    }
  };
  return { reading, progress, pendingFiles, readFiles, cancel };
};

export default useScreenshotReader;
