import { hasNewMainScript } from "./UpdateNotifier";

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
