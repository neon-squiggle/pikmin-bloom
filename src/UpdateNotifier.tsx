import { useCallback, useEffect, useState } from "react";
import { Button, Snackbar } from "@mui/material";

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
  const [newMainScript, setNewMainScript] = useState<string | null>(null);

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
        setNewMainScript(latestMainScript);
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

  const refresh = () => {
    if (!newMainScript) return;
    const publicUrl = process.env.PUBLIC_URL ?? "";
    const version = newMainScript.split("/").pop() ?? Date.now().toString();
    const baseUrl = publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`;
    window.location.replace(
      `${baseUrl}?version=${encodeURIComponent(version)}`,
    );
  };

  return (
    <Snackbar
      open={newMainScript != null}
      message="A new version is available."
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      action={
        <Button color="secondary" size="small" onClick={refresh}>
          Refresh
        </Button>
      }
    />
  );
};

export default UpdateNotifier;
