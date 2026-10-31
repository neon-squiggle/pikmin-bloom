import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import ActionFeedback from "./ActionFeedback";

interface AssetManifest {
  files?: {
    "main.js"?: string;
  };
}

const getLoadedMainScript = () =>
  Array.from(document.scripts)
    .map((script) => script.getAttribute("src"))
    .find((src) => src?.includes("/static/js/main.")) ?? null;

export const hasNewMainScript = (
  loadedMainScript: string | null,
  latestMainScript: string | undefined,
) =>
  Boolean(
    latestMainScript &&
    loadedMainScript &&
    !loadedMainScript.endsWith(latestMainScript),
  );

const UpdateNotifier = () => {
  const [available, setAvailable] = useState<string | null>(null);
  const dismissed = useRef<string | null>(null);
  const checkForUpdate = useCallback(async () => {
    if (process.env.NODE_ENV !== "production") return;

    try {
      const publicUrl = process.env.PUBLIC_URL ?? "";
      const response = await fetch(
        `${publicUrl}/asset-manifest.json?update=${Date.now()}`,
        { cache: "no-store" },
      );
      if (!response.ok) return;

      const manifest = (await response.json()) as AssetManifest;
      const latestMainScript = manifest.files?.["main.js"];
      const loadedMainScript = getLoadedMainScript();

      if (
        latestMainScript &&
        hasNewMainScript(loadedMainScript, latestMainScript) &&
        latestMainScript !== dismissed.current
      ) {
        setAvailable(latestMainScript);
      }
    } catch {
      // A failed update check should never interrupt the calculator.
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    document.addEventListener("visibilitychange", checkWhenVisible);
    window.addEventListener("focus", checkForUpdate);

    return () => {
      document.removeEventListener("visibilitychange", checkWhenVisible);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, [checkForUpdate]);

  const dismiss = () => { dismissed.current = available; setAvailable(null); };
  if (!available) return null;
  return (
    <ActionFeedback key={available} message="Update available" severity="info" onClose={dismiss}
      action={<Button size="small" onClick={() => window.location.reload()}>Reload</Button>} />
  );
};

export default UpdateNotifier;
