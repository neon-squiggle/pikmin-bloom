import { setDateField } from "./testFixtures/dateFields";
import "@testing-library/jest-dom";
import { initialPlannerFinishes } from "./testFixtures/screenshotMushrooms";
import { ReactElement } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  act,
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import CalendarScreenshotUpload from "./CalendarScreenshotUpload";
import {
  BattleScreenshotResult,
  readBattleScreenshot,
} from "./readBattleScreenshot";

const render = (ui: ReactElement) =>
  rtlRender(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {ui}
    </LocalizationProvider>,
  );

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
  capturedAt: "2026-10-30T17:56:19Z",
  warnings: [],
  filename: "one.png",
  title: "Prien Lake Mall East Entrance",
  mushroomType: "Small Red Mushroom",
};
beforeEach(() => read.mockReset());
beforeEach(() => {
  URL.createObjectURL = jest.fn(() => "blob:screenshot-preview");
  URL.revokeObjectURL = jest.fn();
});
const upload = (names: string[]) =>
  fireEvent.change(screen.getByLabelText("Add mushroom screenshots"), {
    target: {
      files: names.map(
        (name) => new File(["pixels"], name, { type: "image/png" }),
      ),
    },
  });

it("counts failed reads and invalid drafts, but not queued screenshots, as needing review", async () => {
  let finishLast!: (result: BattleScreenshotResult) => void;
  read.mockResolvedValueOnce({ ...sample, countdown: null })
    .mockRejectedValueOnce(new Error("Unreadable screenshot"))
    .mockReturnValueOnce(new Promise((resolve) => { finishLast = resolve; }));
  render(<CalendarScreenshotUpload finishes={[]} timezone="America/Los_Angeles" onSave={jest.fn()} />);
  upload(["missing-countdown.png", "failed.png", "still-reading.png"]);
  expect(await screen.findByText("2/3 processed · 2 need review")).toBeInTheDocument();
  const row = within(screen.getByRole("region", { name: "Review missing-countdown.png" }));
  fireEvent.change(row.getByRole("textbox", { name: "Hours" }), { target: { value: "1" } });
  expect(screen.getByText("2/3 processed · 1 needs review")).toBeInTheDocument();
  expect(within(screen.getByRole("status")).queryByText(/remaining/)).not.toBeInTheDocument();
  await act(async () => finishLast(sample));
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

it("keeps a warning on collapsed and resumed screenshots until every required field is corrected", async () => {
  read.mockResolvedValueOnce({ ...sample, capturedAt: null, countdown: null,
    warnings: ["Couldn't read countdown. Enter it manually."] });
  render(<CalendarScreenshotUpload finishes={[]} timezone="America/Los_Angeles" onSave={jest.fn()} />);
  upload(["needs-review.png"]);
  let row = within(await screen.findByRole("region", { name: "Review needs-review.png" }));
  expect(row.getByRole("img", { name: "Needs review" })).toBeInTheDocument();
  fireEvent.click(row.getByRole("button", { name: "Dismiss notification" }));
  fireEvent.click(row.getByRole("button", { name: /Prien Lake Mall/ }));
  expect(row.getByRole("img", { name: "Needs review" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  const add = await screen.findByRole("button", { name: "Add mushrooms" });
  expect(within(add).getByRole("img", { name: "Screenshots need review" })).toBeInTheDocument();
  fireEvent.click(add);
  fireEvent.click(screen.getByRole("menuitem", { name: "Resume screenshots" }));
  row = within(await screen.findByRole("region", { name: "Review needs-review.png" }));
  expect(row.getByRole("img", { name: "Needs review" })).toBeInTheDocument();
  setDateField(row.getByRole("group", { name: "Screenshot captured at" }), "10/30/2026 10:56:19 AM");
  expect(row.getByRole("img", { name: "Needs review" })).toBeInTheDocument();
  fireEvent.change(row.getByRole("textbox", { name: "Hours" }), { target: { value: "1" } });
  expect(row.queryByRole("img", { name: "Needs review" })).not.toBeInTheDocument();
  expect(screen.queryByText(/screenshots need review$/)).not.toBeInTheDocument();
  fireEvent.click(row.getByRole("button", { name: /Prien Lake Mall/ }));
  expect(row.queryByRole("img", { name: "Needs review" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  const correctedAdd = await screen.findByRole("button", { name: "Add mushrooms" });
  expect(within(correctedAdd).queryByRole("img", { name: "Screenshots need review" })).not.toBeInTheDocument();
  fireEvent.click(correctedAdd);
  const resume = screen.getByRole("menuitem", { name: "Resume screenshots" });
  expect(within(resume).queryByRole("img", { name: "Screenshots need review" })).not.toBeInTheDocument();
  fireEvent.click(resume);
  row = within(await screen.findByRole("region", { name: "Review needs-review.png" }));
  fireEvent.click(row.getByRole("button", { name: /Prien Lake Mall/ }));
  fireEvent.change(row.getByRole("textbox", { name: "Title" }), { target: { value: "" } });
  expect(row.getByRole("img", { name: "Needs review" })).toBeInTheDocument();
});

it("keeps every failed screenshot identifiable and available for manual correction", async () => {
  read.mockRejectedValueOnce(new Error("Could not locate icons"))
    .mockResolvedValueOnce(sample)
    .mockRejectedValueOnce(new Error("Reader unavailable"));
  const onSave = jest.fn();
  render(<CalendarScreenshotUpload finishes={[]} timezone="America/Los_Angeles" onSave={onSave} />);
  upload(["first-failure.png", "good.png", "last-failure.png"]);
  const first = within(await screen.findByRole("region", { name: "Unread first-failure.png" }));
  const last = within(await screen.findByRole("region", { name: "Unread last-failure.png" }));
  expect(first.getByText(/Could not locate icons/)).toBeInTheDocument();
  expect(await last.findByText(/Reader unavailable/)).toBeInTheDocument();
  fireEvent.click(first.getByRole("button", { name: "View screenshot first-failure.png" }));
  expect(screen.getByRole("dialog", { name: "first-failure.png" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Screenshot first-failure.png" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "first-failure.png" })).not.toBeInTheDocument());
  fireEvent.click(first.getByRole("button", { name: "Enter manually" }));
  const manual = within(await screen.findByRole("region", { name: "Review first-failure.png" }));
  expect(manual.getByRole("textbox", { name: "Title" })).toHaveFocus();
  fireEvent.change(manual.getByRole("textbox", { name: "Title" }), { target: { value: "Completed battle" } });
  const type = manual.getByRole("combobox", { name: "Mushroom type" });
  fireEvent.change(type, { target: { value: "Small Red Mushroom" } });
  fireEvent.click(screen.getByRole("option", { name: "Small Red Mushroom" }));
  setDateField(manual.getByRole("group", { name: "Screenshot captured at" }), "10/01/2026 12:00:00 AM");
  fireEvent.change(manual.getByRole("textbox", { name: "Hours" }), { target: { value: "1" } });
  expect(screen.getByRole("button", { name: "Save 2 mushrooms" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Save 2 mushrooms" }));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave.mock.calls[0][0].finishes.some((finish: { filename: string }) => finish.filename === "first-failure.png")).toBe(true);
  expect(screen.getByRole("region", { name: "Unread last-failure.png" })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Review good.png" })).not.toBeInTheDocument();
  expect(read).toHaveBeenCalledTimes(3);
});

it("retries one failed file and clears its old error without losing other failures", async () => {
  read.mockRejectedValueOnce(new Error("First problem"))
    .mockRejectedValueOnce(new Error("Second problem"));
  render(<CalendarScreenshotUpload finishes={[]} timezone="America/Los_Angeles" onSave={jest.fn()} />);
  upload(["first.png", "second.png"]);
  const second = within(await screen.findByRole("region", { name: "Unread second.png" }));
  await waitFor(() => expect(second.getByRole("button", { name: "Retry" })).toBeEnabled());
  read.mockResolvedValueOnce(sample);
  fireEvent.click(second.getByRole("button", { name: "Retry" }));
  await screen.findByRole("region", { name: "Review second.png" });
  expect(screen.queryByText(/Second problem/)).not.toBeInTheDocument();
  expect(screen.getByText(/First problem/)).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole("region", { name: "Unread first.png" })).getByRole("button", { name: "Skip screenshot" }));
  expect(screen.queryByRole("button", { name: /Retry 1 screenshot/ })).not.toBeInTheDocument();
});

it("reviews a batch before updating matching mushrooms", async () => {
  const onSave = jest.fn();
  read
    .mockResolvedValueOnce(sample)
    .mockResolvedValueOnce({
      ...sample,
      capturedAt: "2026-10-30T17:56:27Z",
      title: "Harbour Town Park Nth Entrance.",
      mushroomType: "Giant Halloween Mushroom",
    });
  render(
    <CalendarScreenshotUpload
      finishes={initialPlannerFinishes()}
      timezone="America/Los_Angeles"
      onSave={onSave}
    />,
  );
  upload(["one.png", "two.png"]);
  await screen.findByRole("region", { name: "Review two.png" });
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.queryByRole("combobox", { name: "Save as" })).toBeNull();
  expect(
    screen.getByRole("button", { name: /Prien Lake Mall East Entrance/ }),
  ).not.toBeNull();
  expect(screen.getByRole("button", { name: /Harbour Town/ })).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save 2 mushrooms" }));
  expect(onSave.mock.calls[0][0].finishes).toHaveLength(5);
  expect(onSave.mock.calls[0][0].updated).toBe(2);
  expect(read.mock.calls.every((args) => args[3] === true)).toBe(true);
});

it("previews a successful read and returns to the same editable review", async () => {
  read.mockResolvedValueOnce(sample);
  render(<CalendarScreenshotUpload finishes={[]} timezone="America/Los_Angeles" onSave={jest.fn()} />);
  upload(["success.png"]);
  const row = within(await screen.findByRole("region", { name: "Review success.png" }));
  fireEvent.click(row.getByRole("button", { name: /Prien Lake Mall East Entrance/ }));
  fireEvent.change(row.getByRole("textbox", { name: "Title" }), { target: { value: "Verified park" } });
  fireEvent.click(row.getByRole("button", { name: "View screenshot success.png" }));
  const preview = within(screen.getByRole("dialog", { name: "success.png" }));
  expect(preview.getByRole("img", { name: "Screenshot success.png" })).toBeInTheDocument();
  expect(preview.getByRole("link", { name: "Open full size" })).toHaveAttribute("href", "blob:screenshot-preview");
  fireEvent.click(preview.getByRole("button", { name: "Close preview" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "success.png" })).not.toBeInTheDocument());
  expect(row.getByRole("textbox", { name: "Title" })).toHaveValue("Verified park");
  expect(read).toHaveBeenCalledTimes(1);
});

it("requires a capture time and a countdown when those fields could not be read", async () => {
  const onSave = jest.fn();
  read.mockResolvedValueOnce({ ...sample, capturedAt: null, countdown: null,
    warnings: ["Couldn't read countdown. Enter it manually."] });
  render(
    <CalendarScreenshotUpload
      finishes={[]}
      timezone="America/Los_Angeles"
      onSave={onSave}
    />,
  );
  upload(["missing.png"]);
  const row = within(
    await screen.findByRole("region", { name: "Review missing.png" }),
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Save 1 mushrooms",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  setDateField(row.getByRole("group", { name: /^Screenshot captured at/ }), "10/30/2026 10:56:19 AM");
  expect(row.queryByText(/Enter screenshot capture time/)).toBeNull();
  fireEvent.change(row.getByRole("textbox", { name: "Days" }), {
    target: { value: "2" },
  });
  expect(row.queryByText("Couldn't read countdown. Enter it manually.")).not.toBeInTheDocument();
  expect(
    (
      screen.getByRole("button", {
        name: "Save 1 mushrooms",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Save 1 mushrooms" }));
  expect(onSave.mock.calls[0][0].finishes[0].endAt).toBe(
    "2026-11-01T17:56:19.000Z",
  );
});

it("preserves successful screenshots when another file fails and allows cancellation before saving", async () => {
  const onSave = jest.fn();
  read
    .mockRejectedValueOnce(new Error("Invalid image"))
    .mockResolvedValueOnce(sample);
  render(
    <CalendarScreenshotUpload
      finishes={initialPlannerFinishes()}
      timezone="America/Los_Angeles"
      onSave={onSave}
    />,
  );
  upload(["bad.png", "good.png"]);
  await screen.findByRole("region", { name: "Review good.png" });
  expect(screen.getByText(/bad.png: Invalid image/)).not.toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("Invalid image");
  expect(screen.getByRole("region", { name: "Review good.png" })).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onSave).not.toHaveBeenCalled();
});

it("appends another batch for review and merges repeated screenshots into one battle", async () => {
  const onSave = jest.fn();
  read
    .mockResolvedValueOnce(sample)
    .mockResolvedValueOnce({ ...sample, capturedAt: "2026-10-30T18:00:00Z" });
  render(
    <CalendarScreenshotUpload
      finishes={[]}
      timezone="America/Los_Angeles"
      onSave={onSave}
    />,
  );
  expect(
    (screen.getByLabelText("Add mushroom screenshots") as HTMLInputElement)
      .multiple,
  ).toBe(true);
  upload(["one.png"]);
  await screen.findByRole("region", { name: "Review one.png" });
  fireEvent.change(screen.getByLabelText("Choose more mushroom screenshots"), {
    target: { files: [new File(["pixels"], "two.png", { type: "image/png" })] },
  });
  await screen.findByRole("region", { name: "Review two.png" });
  expect(screen.getByRole("region", { name: "Review one.png" })).not.toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Review two.png" })).getByText(
      "Update existing",
    ),
  ).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save 2 mushrooms" }));
  expect(onSave.mock.calls[0][0].finishes).toHaveLength(1);
  expect(onSave.mock.calls[0][0].finishes[0].capturedAt).toBe(
    "2026-10-30T18:00:00Z",
  );
});

it("keeps edited review drafts when closed and resumes them without another OCR read", async () => {
  const onSave = jest.fn();
  read.mockResolvedValueOnce(sample);
  render(
    <CalendarScreenshotUpload
      finishes={[]}
      timezone="America/Los_Angeles"
      onSave={onSave}
    />,
  );
  upload(["one.png"]);
  const row = within(
    await screen.findByRole("region", { name: "Review one.png" }),
  );
  fireEvent.click(row.getByRole("button", { name: /Prien Lake Mall/ }));
  fireEvent.change(row.getByRole("textbox", { name: "Title" }), {
    target: { value: "Corrected park" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(await screen.findByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Resume screenshots" }));
  fireEvent.click(
    await screen.findByRole("button", { name: /Corrected park/ }),
  );
  expect(
    (
      (await screen.findByRole("textbox", {
        name: "Title",
      })) as HTMLInputElement
    ).value,
  ).toBe("Corrected park");
  expect(read).toHaveBeenCalledTimes(1);
});

it("explains a zero countdown and focuses its input from Review", async () => {
  read.mockResolvedValueOnce({
    ...sample,
    countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
  });
  render(
    <CalendarScreenshotUpload
      finishes={[]}
      timezone="America/Los_Angeles"
      onSave={jest.fn()}
    />,
  );
  upload(["zero.png"]);
  const row = within(
    await screen.findByRole("region", { name: "Review zero.png" }),
  );
  expect(row.getByText("Enter time remaining.")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  await waitFor(() =>
    expect(row.getByRole("textbox", { name: "Days" })).toHaveFocus(),
  );
  fireEvent.change(row.getByRole("textbox", { name: "Hours" }), {
    target: { value: "1" },
  });
  expect(row.queryByText("Enter time remaining.")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Save 1 mushrooms" }),
  ).not.toBeDisabled();
});

it("resumes stopped files without losing successful drafts or rereading them", async () => {
  let slowResolve!: (value: BattleScreenshotResult) => void;
  read.mockResolvedValueOnce(sample).mockReturnValueOnce(
    new Promise((resolve) => {
      slowResolve = resolve;
    }),
  );
  const onSave = jest.fn();
  render(
    <CalendarScreenshotUpload
      finishes={[]}
      timezone="America/Los_Angeles"
      onSave={onSave}
    />,
  );
  upload(["one.png", "two.png", "three.png"]);
  await screen.findByRole("region", { name: "Review one.png" });
  fireEvent.click(screen.getByRole("button", { name: "Stop reading" }));
  await screen.findByRole("button", { name: "Retry 2 screenshots" });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(await screen.findByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Resume screenshots" }));
  read
    .mockResolvedValueOnce({ ...sample, title: "Second park" })
    .mockResolvedValueOnce({ ...sample, title: "Third park" });
  fireEvent.click(
    await screen.findByRole("button", { name: "Retry 2 screenshots" }),
  );
  await screen.findByRole("region", { name: "Review three.png" });
  expect(screen.getByRole("region", { name: "Review one.png" })).not.toBeNull();
  expect(read.mock.calls.map((call) => call[0].name)).toEqual([
    "one.png",
    "two.png",
    "two.png",
    "three.png",
  ]);
  await act(async () => slowResolve(sample));
  fireEvent.click(screen.getByRole("button", { name: "Save 3 mushrooms" }));
  expect(onSave.mock.calls[0][0].finishes).toHaveLength(3);
});


it("accepts an optional start date during screenshot review and saves it without duplicating the mushroom", async () => {
  const onSave = jest.fn();
  read.mockResolvedValueOnce(sample);
  render(<CalendarScreenshotUpload finishes={initialPlannerFinishes()} timezone="America/Los_Angeles" onSave={onSave} />);
  upload(["dated.png"]);
  const row = within(await screen.findByRole("region", { name: "Review dated.png" }));
  fireEvent.click(row.getByRole("button", { name: /Prien Lake Mall East Entrance/ }));
  setDateField(row.getByRole("group", { name: "Start date" }), "10/30/2026");
  fireEvent.click(screen.getByRole("button", { name: "Save 1 mushrooms" }));
  const saved = onSave.mock.calls[0][0];
  expect(saved.added).toBe(0);
  expect(saved.updated).toBe(1);
  expect(saved.finishes.find((finish: { id: string }) => finish.id === "IMG_4082").tryDay).toBe("2026-10-30");
});
