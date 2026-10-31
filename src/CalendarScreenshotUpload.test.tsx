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
const upload = (names: string[]) =>
  fireEvent.change(screen.getByLabelText("Add mushroom screenshots"), {
    target: {
      files: names.map(
        (name) => new File(["pixels"], name, { type: "image/png" }),
      ),
    },
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

it("requires a capture time and a countdown when those fields could not be read", async () => {
  const onSave = jest.fn();
  read.mockResolvedValueOnce({ ...sample, capturedAt: null, countdown: null });
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
  expect(screen.getByText("bad.png: Invalid image")).not.toBeNull();
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
