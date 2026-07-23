import { useCallback, useEffect } from "react";

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

const RELOAD_ATTEMPT_KEY = "pikmin-bloom:reload-attempt";
const RELOAD_RETRY_MS = 60_000;
let attemptedMainScript: string | null = null;

const UpdateNotifier = () => {
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
        hasNewMainScript(loadedMainScript, latestMainScript)
      ) {
        if (attemptedMainScript === latestMainScript) return;

        try {
          const previousAttempt = sessionStorage.getItem(RELOAD_ATTEMPT_KEY);
          const [previousScript, previousTime] =
            previousAttempt?.split("\n") ?? [];
          if (
            previousScript === latestMainScript &&
            Date.now() - Number(previousTime) < RELOAD_RETRY_MS
          ) {
            return;
          }
          sessionStorage.setItem(
            RELOAD_ATTEMPT_KEY,
            `${latestMainScript}\n${Date.now()}`,
          );
        } catch {
          // The in-memory guard still prevents a reload loop when storage is
          // unavailable.
        }

        attemptedMainScript = latestMainScript;
        window.location.reload();
      } else if (latestMainScript && loadedMainScript) {
        attemptedMainScript = null;
        try {
          sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
        } catch {
          // Storage can be unavailable in privacy-restricted browsers.
        }
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

  return null;
};

export default UpdateNotifier;
