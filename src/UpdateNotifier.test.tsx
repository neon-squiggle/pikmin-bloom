import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UpdateNotifier, { hasNewMainScript } from "./UpdateNotifier";

describe("hasNewMainScript", () => {
  it("detects a changed production asset fingerprint", () => {
    expect(
      hasNewMainScript(
        "https://example.test/pikmin-bloom/static/js/main.old.js",
        "/pikmin-bloom/static/js/main.new.js",
      ),
    ).toBe(true);
  });

  it("does not flag the currently loaded fingerprint", () => {
    expect(
      hasNewMainScript(
        "https://example.test/pikmin-bloom/static/js/main.same.js",
        "/pikmin-bloom/static/js/main.same.js",
      ),
    ).toBe(false);
  });
});

it("offers an update without automatically replacing an open draft", async () => {
  const environment = process.env as Record<string, string | undefined>;
  const original = environment.NODE_ENV,
    originalFetch = global.fetch;
  environment.NODE_ENV = "production";
  global.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({ files: { "main.js": "/static/js/main.new.js" } }),
    });
  const script = document.createElement("script");
  script.src = "/static/js/main.old.js";
  document.head.appendChild(script);
  try {
    render(
      <>
        <input aria-label="Draft" defaultValue="Unsaved plan" />
        <UpdateNotifier />
      </>,
    );
    await screen.findByText("Update available");
    expect(screen.getByRole("button", { name: "Reload" })).not.toBeNull();
    expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe(
      "Unsaved plan",
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    await waitFor(() => expect(screen.queryByText("Update available")).toBeNull());
    fireEvent.focus(window);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Update available")).toBeNull();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ files: { "main.js": "/static/js/main.newer.js" } }) });
    fireEvent.focus(window);
    await screen.findByText("Update available");
    expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe(
      "Unsaved plan",
    );
  } finally {
    environment.NODE_ENV = original;
    global.fetch = originalFetch;
    script.remove();
  }
});
