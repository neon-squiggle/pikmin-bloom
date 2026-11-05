import "@testing-library/jest-dom";
import { setDateField } from "./testFixtures/dateFields";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import ExistingMushroomCalc from "./ExistingMushroomCalc";
import {
  BattleScreenshotResult,
  readBattleScreenshot,
} from "./readBattleScreenshot";

jest.mock("./readBattleScreenshot", () => ({
  readBattleScreenshot: jest.fn(),
}));
const read = readBattleScreenshot as jest.MockedFunction<
  typeof readBattleScreenshot
>;
const sample: BattleScreenshotResult = {
  healthRemaining: 17510,
  currentAp: 10,
  countdown: { days: 2, hours: 0, minutes: 38, seconds: 26 },
  capturedAt: "2026-10-30T17:56:19.000Z",
  filename: "battle.png",
  warnings: [],
};

const renderCalculator = () => {
  const view = render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ExistingMushroomCalc />
    </LocalizationProvider>,
  );
  return view;
};
const upload = async (result: BattleScreenshotResult) => {
  read.mockResolvedValueOnce(result);
  fireEvent.change(screen.getByLabelText("Upload battle screenshot"), {
    target: {
      files: [new File(["screenshot"], "battle.png", { type: "image/png" })],
    },
  });
  await waitFor(() => expect(input("Upload battle screenshot").disabled).toBe(false));
  expect(screen.queryByText("Screenshot loaded: battle.png")).toBeNull();
  expect(screen.queryByText("Copied")).toBeNull();
};
const input = (label: string): HTMLInputElement => {
  if (label === "Upload battle screenshot") return screen.getByLabelText(label);
  if (label.includes("time") || label.includes("captured at"))
    return within(screen.getByRole("group", { name: label })).getByRole("textbox", { hidden: true }) as HTMLInputElement;
  return screen.getByRole("textbox", { name: label }) as HTMLInputElement;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-30T18:00:00Z"));
  read.mockReset();
  URL.createObjectURL = jest.fn(() => "blob:calculator-screenshot");
  URL.revokeObjectURL = jest.fn();
});
afterEach(() => jest.useRealTimers());

it.each(["success", "failure"])("keeps an optional original preview after parsing %s", async (outcome) => {
  const view = renderCalculator();
  if (outcome === "success") read.mockResolvedValueOnce(sample);
  else read.mockRejectedValueOnce(new Error("Couldn't read the battle stats."));
  fireEvent.change(screen.getByLabelText("Upload battle screenshot"), {
    target: { files: [new File(["pixels"], "verify.png", { type: "image/png" })] },
  });
  await waitFor(() => expect(input("Upload battle screenshot").disabled).toBe(false));
  expect(screen.queryByRole("dialog", { name: "verify.png" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View screenshot verify.png" }));
  const preview = within(screen.getByRole("dialog", { name: "verify.png" }));
  expect(preview.getByRole("img", { name: "Screenshot verify.png" })).toBeInTheDocument();
  expect(preview.getByRole("link", { name: "Open full size" })).toHaveAttribute("href", "blob:calculator-screenshot");
  fireEvent.click(preview.getByRole("button", { name: "Close preview" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "verify.png" })).not.toBeInTheDocument());
  expect(input("Health remaining").value).toBe(outcome === "success" ? "17,510" : "");
  expect(read).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:calculator-screenshot");
});

it("fills editable stats and bases the planner's finish on capture time", async () => {
  renderCalculator();
  await upload(sample);
  expect(input("Health remaining").value).toBe("17,510");
  expect(input("AP").value).toBe("10");
  expect(
    ["Days", "Hours", "Minutes", "Seconds"].map((label) => input(label).value),
  ).toEqual(["2", "0", "38", "26"]);
  expect(input("Desired end time").disabled).toBe(false);

  // The valid target is after the screenshot-based finish but before an
  // incorrectly upload-based finish. It must not produce a bullhorn plan.
  const target = new Date("2026-11-01T18:36:00Z");
  const dayjs = (await import("dayjs")).default;
  setDateField(screen.getByRole("group", { name: "Desired end time" }), dayjs(target).format("MM/DD/YYYY hh:mm A"));
  expect(screen.getByRole("slider")).toBeDisabled();
  setDateField(screen.getByRole("group", { name: "Desired end time" }), dayjs("2026-11-01T17:00:00Z").format("MM/DD/YYYY hh:mm A"));
  expect(input("Additional AP").value).toBe("0.336");
  fireEvent.change(input("AP"), { target: { value: "20" } });
  expect(input("AP").value).toBe("20");
});

it("clears unread fields on replacement rather than mixing snapshots", async () => {
  renderCalculator();
  await upload(sample);
  await upload({
    ...sample,
    healthRemaining: null,
    capturedAt: null,
    warnings: ["Couldn't read remaining health. Enter it manually."],
  });
  expect(input("Health remaining").value).toBe("");
  expect(input("AP").value).toBe("10");
  expect(input("Screenshot captured at").value).toBe("");
  expect(input("Desired end time").disabled).toBe(true);
  expect(screen.getByText(/Capture time is missing/)).not.toBeNull();
});

it("preserves manual values if reading fails", async () => {
  renderCalculator();
  fireEvent.change(input("AP"), { target: { value: "240" } });
  read.mockRejectedValueOnce(new Error("Couldn't read the battle stats."));
  fireEvent.change(screen.getByLabelText("Upload battle screenshot"), {
    target: { files: [new File(["bad"], "battle.png", { type: "image/png" })] },
  });
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "Couldn't read the battle stats",
    ),
  );
  expect(input("AP").value).toBe("240");
  expect(screen.getByRole("alert").textContent).toContain(
    "Couldn't read the battle stats",
  );
  expect(screen.queryByText("Copied")).toBeNull();
  expect(screen.queryByRole("button", { name: "Dismiss notification" })).toBeNull();
  expect(screen.getByRole("button", { name: "Retry screenshot" })).not.toBeNull();
  expect(input("AP").value).toBe("240");
});

it("ignores a canceled read and restores manual entry", async () => {
  renderCalculator();
  read.mockImplementationOnce(
    (_file, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () =>
          reject(new DOMException("Canceled", "AbortError")),
        );
      }),
  );
  fireEvent.change(screen.getByLabelText("Upload battle screenshot"), {
    target: {
      files: [new File(["image"], "battle.png", { type: "image/png" })],
    },
  });
  expect(input("Upload battle screenshot").disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(input("Upload battle screenshot").disabled).toBe(false),
  );
  expect(input("AP").value).toBe("");
  expect(screen.queryByRole("alert")).toBeNull();
});

it("accepts completed battles and can calculate from their capture time", async () => {
  renderCalculator();
  await upload({ ...sample, capturedAt: "2026-10-01T17:56:19Z" });
  expect(input("Desired end time").disabled).toBe(true);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText(/projected finish is in the past/i)).toBeInTheDocument();
  expect(input("Health remaining").value).toBe("17,510");
  fireEvent.click(screen.getByRole("button", { name: "Calculate at capture time" }));
  expect(input("Desired end time").disabled).toBe(false);
  expect(screen.getByText(/Calculating from screenshot capture time/)).toBeInTheDocument();
  const dayjs = (await import("dayjs")).default;
  setDateField(screen.getByRole("group", { name: "Desired end time" }), dayjs("2026-10-03T17:00:00Z").format("MM/DD/YYYY hh:mm A"));
  // 17,510 HP over 169,421 seconds requires 10.335 AP in total.
  expect(input("Additional AP").value).toBe("0.335");
  fireEvent.click(screen.getByRole("button", { name: "Calculate from now" }));
  expect(input("Desired end time").disabled).toBe(true);
});
