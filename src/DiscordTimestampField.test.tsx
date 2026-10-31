import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import DiscordTimestampField from "./DiscordTimestampField";
it("announces copy only after the clipboard operation succeeds", async () => {
  let resolve!: () => void;
  const writeText = jest.fn(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(
    <DiscordTimestampField label="Finish" time={dayjs("2026-11-01T12:00Z")} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Copy Finish" }));
  expect(screen.queryByRole("status")).toBeNull();
  resolve();
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe("Copied"),
  );
});
it("shows selectable text when copying is denied", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: jest.fn().mockRejectedValue(new Error("Denied")) },
  });
  const time = dayjs("2026-11-01T12:00Z");
  render(<DiscordTimestampField label="Finish" time={time} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy Finish" }));
  await screen.findByText(`<t:${time.unix()}:f>`);
  expect(screen.getByRole("alert").textContent).toContain("Copy failed");
  fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
  expect(screen.getByText(`<t:${time.unix()}:f>`)).not.toBeNull();
});
