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
  within,
} from "@testing-library/react";
import MushroomPlanner from "./MushroomPlanner";
import { PLANNER_STORAGE_KEY } from "./stagePlanner";

const render = (ui: ReactElement) =>
  rtlRender(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {ui}
    </LocalizationProvider>,
  );

const dailyChip = (label: string | RegExp, optional = false) => {
  fireEvent.click(screen.getByRole("button", { name: "Daily tries" }));
  const panel = within(screen.getByRole("dialog", { name: "Daily tries" }));
  const chip = optional ? panel.queryByText(label) : panel.getByText(label);
  fireEvent.click(panel.getByRole("button", { name: "Close daily tries" }));
  return chip;
};

const openPlannedTry = () => {
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  const editor = within(screen.getByRole("dialog", { name: "Add mushroom" }));
  fireEvent.click(editor.getByRole("tab", { name: "Planned" }));
  return editor;
};
const addPlannedTry = (end = "11/01/2026 12:00:00 AM", start = "10/31/2026") => {
  const editor = openPlannedTry();
  setDateField(editor.getByRole("group", { name: /^End time/ }), end);
  setDateField(editor.getByRole("group", { name: "Start date" }), start);
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ version: 3, finishes: initialPlannerFinishes() }),
  );
});
afterEach(() => jest.restoreAllMocks());

it("clears mushroom-update feedback five seconds after the latest save without undoing the edit", () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-30T12:00:00Z"));
  try {
    render(<MushroomPlanner />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }));
    const editor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
    fireEvent.change(editor.getByRole("textbox", { name: "Title" }), { target: { value: "Updated park" } });
    fireEvent.click(editor.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Mushroom saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(4000); });
    fireEvent.click(screen.getByRole("button", { name: "Edit Updated park" }));
    const nextEditor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
    fireEvent.change(nextEditor.getByRole("textbox", { name: "Title" }), { target: { value: "Latest park" } });
    fireEvent.click(nextEditor.getByRole("button", { name: "Save" }));
    act(() => { jest.advanceTimersByTime(4000); });
    expect(screen.getByText("Mushroom saved")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(1000); });
    expect(screen.queryByText("Mushroom saved")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Latest park" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.some((finish: { title: string }) => finish.title === "Latest park")).toBe(true);
  } finally {
    jest.clearAllTimers();
    jest.useRealTimers();
  }
});

it("hides planner Undo notifications when the calculator is active", () => {
  const view = render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }));
  const editor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
  fireEvent.change(editor.getByRole("textbox", { name: "Title" }), { target: { value: "Updated park" } });
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  view.rerender(<LocalizationProvider dateAdapter={AdapterDayjs}><MushroomPlanner active={false} /></LocalizationProvider>);
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
});

it("always shows non-mushroom steps, including when an old plan hid them", () => {
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      finishes: initialPlannerFinishes(),
      hideOtherSteps: true,
    }),
  );
  render(<MushroomPlanner />);
  expect(screen.getAllByRole("region", { name: /^Step / })).toHaveLength(16);
  expect(screen.getByText(/Plant 2,000 most common primary/)).not.toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Step 3–2" })).getByText(
      "Plant 1,500 secondary",
    ),
  ).not.toBeNull();
  expect(
    screen.queryByRole("checkbox", { name: "Hide non-mushroom steps" }),
  ).toBeNull();
});

it("sets month-scoped progress from now, retains history, and resets the projection", () => {
  const now = Date.parse("2026-11-04T12:00:00Z");
  jest.spyOn(Date, "now").mockReturnValue(now);
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      timezone: "UTC",
      finishes: [
        {
          id: "history",
          title: "Earlier park",
          type: "Small Red Mushroom",
          source: "manual",
          endAt: "2026-11-03T12:00:00Z",
        },
        ...[5, 6, 7].map((day) => ({
          id: String(day),
          title: `Park ${day}`,
          type: "Small Red Mushroom",
          source: "manual",
          endAt: `2026-11-0${day}T12:00:00Z`,
        })),
      ],
    }),
  );
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(screen.queryByRole("button", { name: "Set progress" })).toBeNull();
  expect(screen.queryByRole("dialog", { name: "Event progress" })).toBeNull();
  let editor = within(screen.getByRole("group", { name: "Event progress" }));
  fireEvent.change(editor.getByRole("textbox", { name: "Stage" }), {
    target: { value: "3" },
  });
  fireEvent.mouseDown(editor.getByRole("combobox", { name: "Step" }));
  fireEvent.click(screen.getByRole("option", { name: /^Step 3/ }));
  fireEvent.change(
    editor.getByRole("textbox", { name: "Mushrooms already counted" }),
    { target: { value: "2" } },
  );
  expect(editor.queryByRole("button", { name: "Apply" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Step 1–1" })).toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Step 3–3" })).getAllByRole(
      "button",
      { name: /^Edit / },
    ),
  ).toHaveLength(2);
  expect(
    within(screen.getByRole("region", { name: "Step 3–4" })).getByText(
      "Park 7",
    ),
  ).not.toBeNull();
  expect(screen.queryByText("Earlier park")).toBeNull();
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).eventProgress[
      "2026-11"
    ],
  ).toMatchObject({
    stage: 3,
    step: 3,
    counted: 2,
    asOf: new Date(now).toISOString(),
  });
  fireEvent.click(screen.getByRole("tab", { name: "End times" }));
  expect(
    screen.getByRole("button", { name: "Edit Earlier park" }),
  ).not.toBeNull();
  editor = within(screen.getByRole("group", { name: "Event progress" }));
  fireEvent.click(editor.getByRole("button", { name: "Reset progress" }));
  fireEvent.click(screen.getByRole("tab", { name: "Stages" }));
  expect(screen.getByRole("region", { name: "Step 1–1" })).not.toBeNull();
  expect(screen.getByText("Earlier park")).not.toBeNull();
});

it("invalidates calculated metadata on a type edit while preserving it on a rename", () => {
  const planned = {
    id: "planned",
    title: "Named plan",
    type: "Small Red Mushroom",
    source: "hypothetical",
    status: "planned",
    endAt: "2026-11-04T12:00:00Z",
    startAt: "2026-11-03T12:00:00Z",
    plannedAp: 100,
    plannedHealth: 87400,
  };
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ version: 3, timezone: "UTC", finishes: [planned] }),
  );
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Edit Named plan" }));
  let editor = within(screen.getByRole("dialog"));
  fireEvent.change(editor.getByRole("textbox", { name: "Title" }), {
    target: { value: "Renamed plan" },
  });
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes[0].startAt,
  ).toBe(planned.startAt);
  fireEvent.click(screen.getByRole("button", { name: "Edit Renamed plan" }));
  editor = within(screen.getByRole("dialog"));
  fireEvent.change(editor.getByRole("combobox", { name: "Mushroom type" }), {
    target: { value: "Giant Event Mushroom" },
  });
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  const record = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!)
    .finishes[0];
  expect(record.startAt).toBeUndefined();
  expect(record.plannedHealth).toBeUndefined();
  expect(record.plannedAp).toBeUndefined();
  expect(record.type).toBe("Giant Event Mushroom");
});

it("keeps past mushrooms visible for correction and recalculates presumed completion", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-03T00:00:00Z"));
  render(<MushroomPlanner />);
  expect(
    screen.queryByRole("checkbox", { name: "Hide completed steps" }),
  ).toBeNull();
  expect(screen.getByRole("region", { name: "Step 1–4" })).not.toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  );
  const editor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
  fireEvent.change(editor.getByRole("textbox", { name: "Title" }), {
    target: { value: "Corrected place" },
  });
  fireEvent.change(editor.getByRole("combobox", { name: "Mushroom type" }), {
    target: { value: "Large Ice Blue Mushroom" },
  });
  setDateField(editor.getByRole("group", { name: /^End time/ }), "11/10/2026 12:00:00 PM");
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Corrected place")).not.toBeNull();
  expect(screen.getByText("Large Ice Blue Mushroom")).not.toBeNull();
  expect(screen.getByRole("region", { name: "Step 1–4" })).not.toBeNull();
  const saved = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!);
  expect(
    saved.finishes.find((record: { id: string }) => record.id === "IMG_4082")
      .title,
  ).toBe("Corrected place");
});

it("keeps past mushrooms editable without a count-toward-stages control", () => {
  render(<MushroomPlanner />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  );
  expect(
    screen.queryByRole("checkbox", { name: "Count toward stages" }),
  ).toBeNull();
  expect(
    within(screen.getByRole("dialog")).getByRole("textbox", { name: "Title" }),
  ).not.toBeNull();
});

it("allows a fourth daily try, displays 4/3, and lets a removed try be restored", () => {
  render(<MushroomPlanner />);
  for (let index = 0; index < 4; index++) addPlannedTry();
  expect(dailyChip("Oct 31 · 4/3")).not.toBeNull();
  expect(
    screen.getAllByRole("button", { name: "Edit Daily mushroom" }),
  ).toHaveLength(4);
  fireEvent.click(
    screen.getAllByRole("button", { name: "Edit Daily mushroom" })[0],
  );
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Remove" }),
  );
  expect(dailyChip("Oct 31 · 3/3")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(dailyChip("Oct 31 · 4/3")).not.toBeNull();
});

it("updates presumed completion when the next finish passes without reloading", () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-11-03T12:00:00Z"));
  const now = Date.now();
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      finishes: initialPlannerFinishes()
        .slice(0, 2)
        .map((record) => ({
          ...record,
          endAt: new Date(now + 1000).toISOString(),
        })),
    }),
  );
  try {
    render(<MushroomPlanner />);
    expect(screen.getByRole("region", { name: "Step 1–4" })).not.toBeNull();
    act(() => jest.advanceTimersByTime(1100));
    expect(
      within(screen.getByRole("region", { name: "Step 1–4" })).getByText(
        /Complete/,
      ),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Edit Prien Lake Mall East Entrance",
      }),
    ).not.toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

it("rejects skipped clocks and requires a choice for repeated clocks before saving", () => {
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      finishes: initialPlannerFinishes(),
      timezone: "America/Los_Angeles",
    }),
  );
  render(<MushroomPlanner />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  );
  const editor = within(screen.getByRole("dialog"));
  setDateField(editor.getByRole("group", { name: /^End time/ }), "03/08/2026 02:30:00 AM");
  expect(
    (editor.getByRole("button", { name: "Save" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(editor.getByText(/Enter a valid date and time/)).not.toBeNull();
  setDateField(editor.getByRole("group", { name: /^End time/ }), "11/01/2026 01:30:00 AM");
  expect(
    (editor.getByRole("button", { name: "Save" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.mouseDown(
    editor.getByRole("combobox", { name: "Clock occurrence" }),
  );
  fireEvent.click(screen.getByRole("option", { name: /Second/ }));
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  const saved = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!);
  expect(
    saved.finishes.find((record: { id: string }) => record.id === "IMG_4082")
      .endAt,
  ).toBe("2026-11-01T09:30:00.000Z");
});

it("changes the display timezone without moving finish instants", () => {
  render(<MushroomPlanner />);
  const original = JSON.parse(
    localStorage.getItem(PLANNER_STORAGE_KEY)!,
  ).finishes;
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Timezone" }), {
    target: { value: "Asia/Tokyo" },
  });
  fireEvent.click(screen.getByRole("option", { name: "Asia/Tokyo" }));
  const saved = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!);
  expect(saved.timezone).toBe("Asia/Tokyo");
  expect(saved.finishes).toEqual(original);
});

it("clears only hypothetical daily tries and restores the whole batch with Undo", () => {
  render(<MushroomPlanner />);
  for (let index = 0; index < 4; index++) addPlannedTry();
  fireEvent.click(screen.getByRole("button", { name: "Daily tries" }));
  fireEvent.click(screen.getByRole("button", { name: "Clear daily tries" }));
  fireEvent.click(screen.getByRole("button", { name: "Close daily tries" }));
  expect(
    screen.queryAllByRole("button", { name: "Edit Daily mushroom" }),
  ).toHaveLength(0);
  expect(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  ).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(
    screen.getAllByRole("button", { name: "Edit Daily mushroom" }),
  ).toHaveLength(4);
});

it("redistributes five same-time daily tries and pushes existing mushrooms into later tasks", () => {
  render(<MushroomPlanner />);
  for (let index = 0; index < 5; index++) addPlannedTry();
  expect(
    within(screen.getByRole("region", { name: "Step 1–4" })).getAllByText(
      "Daily mushroom",
    ),
  ).toHaveLength(2);
  expect(
    within(screen.getByRole("region", { name: "Step 2–2" })).getAllByText(
      "Daily mushroom",
    ),
  ).toHaveLength(2);
  expect(
    within(screen.getByRole("region", { name: "Step 2–3" })).getAllByText(
      "Daily mushroom",
    ),
  ).toHaveLength(1);
  expect(
    within(screen.getByRole("region", { name: "Step 2–3" })).getByText(
      "Prien Lake Mall East Entrance",
    ),
  ).not.toBeNull();
  expect(screen.queryByText("Unassigned finishes")).toBeNull();
  expect(dailyChip("Oct 31 · 5/3")).not.toBeNull();
});

it("adds a mushroom from its countdown and restores its finish from storage", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-30T17:00:00Z"));
  const view = render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  expect(
    screen.getByRole("menuitem", { name: "Upload screenshots" }),
  ).not.toBeNull();
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  const editor = within(screen.getByRole("dialog", { name: "Add mushroom" }));
  fireEvent.change(editor.getByRole("textbox", { name: "Title" }), {
    target: { value: "Manual park" },
  });
  const type = editor.getByRole("combobox", { name: "Mushroom type" });
  fireEvent.change(type, { target: { value: "Small Red" } });
  fireEvent.keyDown(type, { key: "ArrowDown" });
  expect(
    screen.queryByRole("option", { name: "Small Blue Mushroom" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("option", { name: "Small Red Mushroom" }));
  fireEvent.change(editor.getByRole("textbox", { name: "Days" }), {
    target: { value: "2" },
  });
  fireEvent.change(editor.getByRole("textbox", { name: "Hours" }), {
    target: { value: "3" },
  });
  fireEvent.change(editor.getByRole("textbox", { name: "Minutes" }), {
    target: { value: "4" },
  });
  fireEvent.change(editor.getByRole("textbox", { name: "Seconds" }), {
    target: { value: "5" },
  });
  expect(editor.queryByLabelText(/^End time/)).toBeNull();
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
  const saved = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!);
  expect(saved.finishes).toHaveLength(6);
  expect(
    saved.finishes.find(
      (record: { title: string }) => record.title === "Manual park",
    ),
  ).toMatchObject({ source: "manual", endAt: "2026-11-01T20:04:05.000Z" });
  view.unmount();
  render(<MushroomPlanner />);
  expect(
    screen.getByRole("button", { name: "Edit Manual park" }),
  ).not.toBeNull();
});

it("counts daily allowance on the try date even when mushrooms finish in another month", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-30T18:00:00Z"));
  render(<MushroomPlanner />);
  for (let index = 0; index < 3; index++)
    addPlannedTry("11/02/2026 12:00:00 PM");
  expect(dailyChip("Oct 31 · 3/3")).not.toBeNull();
  expect(dailyChip("Oct 31 · 3/3")).not.toBeNull();
  const saved = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!);
  expect(
    saved.finishes.filter(
      (record: { tryDay: string }) => record.tryDay === "2026-10-31",
    ),
  ).toHaveLength(3);
  fireEvent.click(
    screen.getAllByRole("button", { name: "Edit Daily mushroom" })[0],
  );
  const editor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
  setDateField(editor.getByRole("group", { name: "Start date" }), "10/30/2026");
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  expect(dailyChip("Oct 31 · 2/3")).not.toBeNull();
  expect(dailyChip("Oct 30 · 1/3")).not.toBeNull();
});

it("requires a end time while keeping start details optional and exposing no accounting or month-switch UI", () => {
  render(<MushroomPlanner />);
  expect(screen.queryByRole("combobox", { name: "Event month" })).toBeNull();
  expect(screen.queryByText(/used elsewhere/i)).toBeNull();
  const editor = openPlannedTry();
  setDateField(editor.getByRole("group", { name: "Start date" }), "10/31/2026");
  setDateField(editor.getByRole("group", { name: /^End time/ }), "");
  expect(editor.getByRole("button", { name: "Add mushroom" })).toBeDisabled();
  setDateField(editor.getByRole("group", { name: /^End time/ }), "11/02/2026 12:00:00 PM");
  expect(editor.getByRole("button", { name: "Add mushroom" })).not.toBeDisabled();
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
  for (let index = 0; index < 2; index++) addPlannedTry("11/02/2026 12:00:00 PM");
  expect(dailyChip("Oct 31 · 3/3")).not.toBeNull();
  expect(dailyChip(/Nov 7 ·/, true)).toBeNull();
  expect(
    screen.getAllByRole("button", { name: "Edit Daily mushroom" }),
  ).toHaveLength(3);
});

it("allows an optional start date for running screenshots without exposing a calculated start time", () => {
  const records = initialPlannerFinishes();
  records[0] = {
    ...records[0],
    startAt: "2026-10-31T12:00:00Z",
    tryDay: "2026-10-31",
  };
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ version: 3, finishes: records }),
  );
  render(<MushroomPlanner onCalculate={jest.fn()} />);
  expect(screen.queryByText(/^Start Oct/)).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  );
  const editor = within(screen.getByRole("dialog"));
  expect(editor.queryByRole("button", { name: "Start time" })).toBeNull();
  expect(editor.getByRole("group", { name: "Start date" })).toBeInTheDocument();
  expect(editor.getByRole("group", { name: /^End time/ })).not.toBeNull();
});

it("saves an end-only hypothetical without inventing its start day", () => {
  render(<MushroomPlanner />);
  const editor = openPlannedTry();
  setDateField(editor.getByRole("group", { name: /^End time/ }), "11/02/2026 12:00:00 PM");
  setDateField(editor.getByRole("group", { name: "Start date" }), "");
  expect(editor.getByRole("button", { name: "Add mushroom" })).not.toBeDisabled();
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
  const saved = JSON.parse(
    localStorage.getItem(PLANNER_STORAGE_KEY)!,
  ).finishes.find(
    (record: { source: string }) => record.source === "hypothetical",
  );
  expect(saved.tryDay).toBeUndefined();
  expect(saved.endAt).toBeTruthy();
});

it("initializes today's view only while visible and restores each desktop tab independently", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-04T15:00:00Z"));
  const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTo");
  const scroll = jest.fn(function (this: HTMLElement, options: ScrollToOptions) {
    this.scrollTop = options.top ?? 0;
  });
  Object.defineProperty(Element.prototype, "scrollTo", { configurable: true, value: scroll });
  const rect = jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const top = this.dataset.finishDate === "2026-11-04" ? 500 : 0;
    return { top, bottom: top + 48, height: 48, width: 0, left: 0, right: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  });
  try {
    const view = render(<MushroomPlanner active={false} />);
    expect(scroll).not.toHaveBeenCalled();
    const rerender = (active: boolean) => view.rerender(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MushroomPlanner active={active} />
      </LocalizationProvider>,
    );
    rerender(true);
    const container = scroll.mock.instances[0] as unknown as HTMLElement;
    expect(container.scrollTop).toBe(440);
    container.scrollTop = 850;
    fireEvent.click(screen.getByRole("tab", { name: "End times" }));
    expect(container.scrollTop).toBe(1290);
    container.scrollTop = 120;
    fireEvent.click(screen.getByRole("tab", { name: "Stages" }));
    expect(container.scrollTop).toBe(850);
    container.scrollTop = 920;
    fireEvent.click(screen.getByRole("tab", { name: "End times" }));
    expect(container.scrollTop).toBe(120);
    fireEvent.click(screen.getByRole("tab", { name: "Stages" }));
    expect(container.scrollTop).toBe(920);
    const calls = scroll.mock.calls.length;
    rerender(false);
    rerender(true);
    expect(scroll).toHaveBeenCalledTimes(calls);
  } finally {
    rect.mockRestore();
    if (originalScroll) Object.defineProperty(Element.prototype, "scrollTo", originalScroll);
    else Reflect.deleteProperty(Element.prototype, "scrollTo");
  }
});

it("remembers separate page positions on phones and starts an unseen view at the top without today's mushrooms", () => {
  const originalMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes("max-width:599.95px"), media: query,
    addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(),
  }));
  const originalY = Object.getOwnPropertyDescriptor(window, "scrollY");
  let offset = 0;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => offset });
  const scroll = jest.spyOn(window, "scrollTo").mockImplementation(((options: ScrollToOptions) => { offset = options.top ?? 0; }) as typeof window.scrollTo);
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-30T15:00:00Z"));
  try {
    render(<MushroomPlanner />);
    offset = 800;
    fireEvent.click(screen.getByRole("tab", { name: "End times" }));
    expect(offset).toBe(0);
    offset = 240;
    fireEvent.click(screen.getByRole("tab", { name: "Stages" }));
    expect(offset).toBe(800);
    fireEvent.click(screen.getByRole("tab", { name: "End times" }));
    expect(offset).toBe(240);
  } finally {
    window.matchMedia = originalMedia;
    scroll.mockRestore();
    if (originalY) Object.defineProperty(window, "scrollY", originalY);
  }
});

it("defaults top manual entry to in-progress with countdown inputs", () => {
  render(<MushroomPlanner onCalculate={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  const editor = within(screen.getByRole("dialog", { name: "Add mushroom" }));
  expect(
    editor
      .getByRole("tab", { name: "In progress" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  expect(editor.queryByRole("button", { name: "Start time" })).toBeNull();
  fireEvent.change(editor.getByRole("textbox", { name: "Title" }), {
    target: { value: "Running park" },
  });
  fireEvent.change(editor.getByRole("combobox", { name: "Mushroom type" }), {
    target: { value: "Small Blue Mushroom" },
  });
  fireEvent.change(editor.getByRole("textbox", { name: "Days" }), {
    target: { value: "2" },
  });
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
  const saved = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!);
  expect(
    saved.finishes.find(
      (record: { title: string }) => record.title === "Running park",
    ).status,
  ).toBe("running");
});

it("updates an existing mushroom when it is added manually with the same title and type", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-30T17:00:00Z"));
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  const editor = within(screen.getByRole("dialog", { name: "Add mushroom" }));
  fireEvent.change(editor.getByRole("textbox", { name: "Title" }), {
    target: { value: "  prien lake mall east entrance " },
  });
  fireEvent.change(editor.getByRole("combobox", { name: "Mushroom type" }), {
    target: { value: "Small Red Mushroom" },
  });
  fireEvent.change(editor.getByRole("textbox", { name: "Days" }), {
    target: { value: "2" },
  });
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
  const saved = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!);
  expect(saved.finishes).toHaveLength(5);
  expect(
    saved.finishes.find((record: { id: string }) => record.id === "IMG_4082"),
  ).toMatchObject({
    source: "manual",
    status: "running",
    endAt: "2026-11-01T17:00:00.000Z",
  });
});

it("requires a positive valid countdown and anchors it to the save time", () => {
  let current = Date.parse("2026-10-30T17:00:00Z");
  jest.spyOn(Date, "now").mockImplementation(() => current);
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  const editor = within(screen.getByRole("dialog", { name: "Add mushroom" }));
  fireEvent.change(editor.getByRole("textbox", { name: "Title" }), {
    target: { value: "Countdown park" },
  });
  fireEvent.change(editor.getByRole("combobox", { name: "Mushroom type" }), {
    target: { value: "Small Red Mushroom" },
  });
  const save = editor.getByRole("button", {
    name: "Add mushroom",
  }) as HTMLButtonElement;
  expect(save.disabled).toBe(true);
  fireEvent.change(editor.getByRole("textbox", { name: "Hours" }), {
    target: { value: "24" },
  });
  expect(save.disabled).toBe(true);
  fireEvent.change(editor.getByRole("textbox", { name: "Hours" }), {
    target: { value: "1" },
  });
  expect(save.disabled).toBe(false);
  current += 120000;
  fireEvent.click(save);
  const records = JSON.parse(
    localStorage.getItem(PLANNER_STORAGE_KEY)!,
  ).finishes;
  expect(
    records.find(
      (record: { title: string }) => record.title === "Countdown park",
    ).endAt,
  ).toBe("2026-10-30T18:02:00.000Z");
});

it("starts a fresh plan with no example mushrooms", () => {
  localStorage.clear();
  render(<MushroomPlanner />);
  expect(screen.getByText("No mushrooms yet")).not.toBeNull();
  expect(screen.queryByRole("button", { name: /^Edit / })).toBeNull();
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes,
  ).toEqual([]);
});
it("marks a missed finish without deleting it, redistributes the projection and supports Undo", () => {
  render(<MushroomPlanner />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  );
  const editor = within(screen.getByRole("dialog"));
  fireEvent.click(editor.getByRole("checkbox", { name: "Exclude from stages" }));
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  expect(
    within(screen.getByRole("region", { name: "Mushrooms excluded from stages" })).getByRole(
      "button",
      { name: "Edit Prien Lake Mall East Entrance" },
    ),
  ).not.toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Step 1–4" })).getByText(
      "Die trauernde Frau",
    ),
  ).not.toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "End times" }));
  fireEvent.click(document.body);
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  fireEvent.click(screen.getByRole("tab", { name: "Stages" }));
  expect(screen.queryByRole("region", { name: "Mushrooms excluded from stages" })).toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Step 1–4" })).getByText(
      "Prien Lake Mall East Entrance",
    ),
  ).not.toBeNull();
});
it("restores an excluded mushroom by editing it without relying on Undo", () => {
  const records = initialPlannerFinishes();
  records[0] = { ...records[0], missed: true };
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify({ version: 3, finishes: records }));
  render(<MushroomPlanner />);
  expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  const excluded = within(screen.getByRole("region", { name: "Mushrooms excluded from stages" }));
  fireEvent.click(excluded.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }));
  const editor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
  const checkbox = editor.getByRole("checkbox", { name: "Exclude from stages" });
  expect(checkbox).toBeChecked();
  fireEvent.click(checkbox);
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  expect(screen.queryByRole("region", { name: "Mushrooms excluded from stages" })).toBeNull();
  expect(within(screen.getByRole("region", { name: "Step 1–4" })).getByText("Prien Lake Mall East Entrance")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.find((finish: { id: string }) => finish.id === records[0].id).missed).toBe(false);
});
it("excludes a mushroom ticket start from the free-try counter", () => {
  render(<MushroomPlanner />);
  const editor = openPlannedTry();
  setDateField(editor.getByRole("group", { name: "Start date" }), "10/31/2026");
  fireEvent.click(editor.getByRole("checkbox", { name: "Mushroom ticket" }));
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
  expect(dailyChip("Oct 31 · 0/3")).not.toBeNull();
  expect(
    screen.getByRole("button", { name: "Edit Daily mushroom" }),
  ).not.toBeNull();
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.find(
      (record: { source: string }) => record.source === "hypothetical",
    ).usesFreeTry,
  ).toBe(false);
});
it("shows every finish at risk before the previous task can be claimed in both planner views", () => {
  const finishes = ["00:00", "01:00", "02:00", "03:00"].map((time, index) => ({
    id: String(index),
    title: `Park ${index}`,
    type: "Small Red Mushroom",
    source: "manual",
    endAt: `2026-11-02T${time}:00Z`,
  }));
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      finishes,
      timezone: "UTC",
      sleepStart: "23:00",
      sleepEnd: "07:00",
    }),
  );
  render(<MushroomPlanner />);
  expect(screen.getAllByText("May be missed")).toHaveLength(2);
  expect(
    within(screen.getByRole("listitem", { name: "Park 1" })).queryByText(
      "May be missed",
    ),
  ).toBeNull();
  expect(
    within(screen.getByRole("listitem", { name: "Park 2" })).getByText(
      "May be missed",
    ),
  ).not.toBeNull();
  expect(
    within(screen.getByRole("listitem", { name: "Park 3" })).getByText(
      "May be missed",
    ),
  ).not.toBeNull();
  expect(screen.queryByText("Sleep")).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "End times" }));
  expect(
    within(
      screen.getByRole("list", { name: "Mushroom end times" }),
    ).getAllByRole("button", { name: /^Edit / }),
  ).toHaveLength(4);
  expect(screen.getAllByText("May be missed")).toHaveLength(2);
});
it.each([
  ["the new event's opening tasks", undefined],
  [
    "a non-mushroom task selected in saved progress",
    { stage: 2, step: 1, counted: 0, asOf: "2026-11-01T01:00:00Z" },
  ],
  [
    "a filled mushroom quota selected in saved progress",
    { stage: 2, step: 2, counted: 2, asOf: "2026-11-01T01:00:00Z" },
  ],
])("flags an end during sleep while waiting to claim %s", (_, progress) => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-01T01:00:00Z"));
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      timezone: "UTC",
      sleepStart: "23:00",
      sleepEnd: "07:00",
      eventProgress: progress ? { "2026-11": progress } : {},
      finishes: [
        {
          id: "early",
          title: "Early park",
          type: "Small Red Mushroom",
          source: "manual",
          endAt: "2026-11-01T02:00:00Z",
        },
      ],
    }),
  );
  render(<MushroomPlanner />);
  expect(
    within(screen.getByRole("listitem", { name: "Early park" })).getByText(
      "May be missed",
    ),
  ).not.toBeNull();
});
it("keeps an already unlocked partial quota safe during sleep and checks the next quota", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-01T01:00:00Z"));
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      timezone: "UTC",
      sleepStart: "23:00",
      sleepEnd: "07:00",
      eventProgress: {
        "2026-11": {
          stage: 2,
          step: 2,
          counted: 1,
          asOf: "2026-11-01T01:00:00Z",
        },
      },
      finishes: ["02:00", "03:00"].map((time, index) => ({
        id: String(index),
        title: `Park ${index}`,
        type: "Small Red Mushroom",
        source: "manual",
        endAt: `2026-11-01T${time}:00Z`,
      })),
    }),
  );
  render(<MushroomPlanner />);
  expect(
    within(screen.getByRole("listitem", { name: "Park 0" })).queryByText(
      "May be missed",
    ),
  ).toBeNull();
  expect(
    within(screen.getByRole("listitem", { name: "Park 1" })).getByText(
      "May be missed",
    ),
  ).not.toBeNull();
});
it("leaves an unset minimum gap empty and preserves clearing after reload", () => {
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ version: 3, finishes: [] }),
  );
  const { unmount } = render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  let field = screen.getByRole("textbox", {
    name: "Minimum time between tasks",
  });
  expect(field).toHaveValue("");
  fireEvent.change(field, { target: { value: "30" } });
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).minimumGapMinutes,
  ).toBe(30);
  fireEvent.change(field, { target: { value: "" } });
  fireEvent.blur(field);
  expect(field).toHaveValue("");
  unmount();
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  field = screen.getByRole("textbox", { name: "Minimum time between tasks" });
  expect(field).toHaveValue("");
});
it("does not flag the 10:18 ending after a 1:21 completion when sleep ends at 10 and the elapsed minimum is 30", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-02T00:00:00Z"));
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      timezone: "UTC",
      sleepStart: "00:00",
      sleepEnd: "10:00",
      minimumGapMinutes: 30,
      eventProgress: {
        "2026-11": {
          stage: 2,
          step: 4,
          counted: 3,
          asOf: "2026-11-02T00:00:00Z",
        },
      },
      finishes: [
        {
          id: "last",
          title: "Last in 2-4",
          type: "Small Red Mushroom",
          source: "manual",
          endAt: "2026-11-02T01:21:00Z",
        },
        {
          id: "next",
          title: "First in 3-2",
          type: "Small Red Mushroom",
          source: "manual",
          endAt: "2026-11-02T10:18:00Z",
        },
      ],
    }),
  );
  render(<MushroomPlanner />);
  expect(
    within(screen.getByRole("region", { name: "Step 2–4" })).getByText(
      "Last in 2-4",
    ),
  ).not.toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Step 3–2" })).getByText(
      "First in 3-2",
    ),
  ).not.toBeNull();
  expect(
    within(screen.getByRole("listitem", { name: "First in 3-2" })).queryByText(
      "May be missed",
    ),
  ).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "End times" }));
  expect(
    within(screen.getByRole("listitem", { name: "First in 3-2" })).queryByText(
      "May be missed",
    ),
  ).toBeNull();
});
it("refreshes the day chips at local midnight without a ticking clock", () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-31T23:59:00Z"));
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      finishes: initialPlannerFinishes(),
      timezone: "UTC",
    }),
  );
  try {
    render(<MushroomPlanner />);
    fireEvent.click(
      screen.getByRole("button", { name: "Daily tries" }),
    );
    expect(screen.getByText("Oct 31 · 0/3")).not.toBeNull();
    act(() => jest.advanceTimersByTime(61000));
    expect(screen.queryByText("Oct 31 · 0/3")).toBeNull();
    expect(screen.getByText("Nov 1 · 0/3")).not.toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

it("combines an imported plan with local mushrooms and can undo the import", async () => {
  const local = {
    version: 3,
    timezone: "America/Los_Angeles",
    sleepStart: "23:00",
    sleepEnd: "07:00",
    minimumGapMinutes: 30,
    finishes: initialPlannerFinishes(),
  };
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(local));
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  const restored = {
    version: 3,
    timezone: "UTC",
    finishes: [
      {
        id: "restored",
        title: "Restored park",
        type: "Small Red Mushroom",
        endAt: "2026-11-03T12:00:00Z",
        source: "manual",
      },
      {
        ...initialPlannerFinishes()[0],
        id: "other-device-copy",
        endAt: "2026-11-05T12:00:00Z",
      },
    ],
  };
  const file = new File([JSON.stringify(restored)], "plan.json", {
    type: "application/json",
  });
  Object.defineProperty(file, "text", {
    value: async () => JSON.stringify(restored),
  });
  fireEvent.change(screen.getByLabelText("Import plan"), {
    target: { files: [file] },
  });
  await screen.findByRole("button", { name: "Edit Restored park" });
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes,
  ).toHaveLength(6);
  expect(JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!)).toMatchObject({
    timezone: local.timezone,
    sleepStart: "23:00",
    sleepEnd: "07:00",
    minimumGapMinutes: 30,
  });
  expect(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  ).not.toBeNull();
  expect(screen.getByText("Plans combined")).not.toBeNull();
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.find(
      (record: { id: string }) => record.id === "IMG_4082",
    ).endAt,
  ).toBe("2026-11-05T12:00:00Z");
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  ).not.toBeNull();
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes,
  ).toEqual(local.finishes);
});
it("keeps the current plan if the selected backup is invalid", async () => {
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  const file = new File(["bad"], "bad.json");
  Object.defineProperty(file, "text", { value: async () => "bad" });
  fireEvent.change(screen.getByLabelText("Import plan"), {
    target: { files: [file] },
  });
  await screen.findByText("Choose a valid plan file.");
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes,
  ).toHaveLength(5);
});

it("adds a planned try from the top action and offers its month when it is hidden", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-30T20:00:00Z"));
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      timezone: "UTC",
      selectedMonth: "2026-10",
      finishes: [],
    }),
  );
  render(<MushroomPlanner onCalculate={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  const editor = within(screen.getByRole("dialog", { name: "Add mushroom" }));
  fireEvent.click(editor.getByRole("tab", { name: "Planned" }));
  expect(editor.queryByRole("textbox", { name: "Days" })).toBeNull();
  expect(
    editor.getByRole("button", { name: "Calculate start time" }),
  ).not.toBeNull();
  setDateField(editor.getByRole("group", { name: /^End time/ }), "11/02/2026 12:00:00 PM");
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
  expect(
    screen.queryByRole("button", { name: "Edit Daily mushroom" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "View November" }));
  expect(
    screen.getByRole("button", { name: "Edit Daily mushroom" }),
  ).not.toBeNull();
  const saved = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!)
    .finishes[0];
  expect(saved).toMatchObject({
    source: "hypothetical",
    status: "planned",
    tryDay: "2026-10-30",
    endAt: "2026-11-02T12:00:00.000Z",
  });
});

it("hands an unsaved planned try to the calculator without adding a record", () => {
  const calculate = jest.fn();
  render(<MushroomPlanner onCalculate={calculate} />);
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  const editor = within(screen.getByRole("dialog"));
  fireEvent.click(editor.getByRole("tab", { name: "Planned" }));
  fireEvent.click(editor.getByRole("button", { name: "Calculate start time" }));
  expect(calculate).toHaveBeenCalledWith(
    expect.objectContaining({ source: "hypothetical", status: "planned" }),
  );
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes,
  ).toHaveLength(5);
});

it("preserves later preference edits when undoing a mushroom change", () => {
  render(<MushroomPlanner />);
  fireEvent.click(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  );
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Remove" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  setDateField(screen.getByRole("group", { name: "Sleep from" }), "11:00 PM");
  expect(screen.getByRole("button", { name: "Dismiss notification" })).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(
    screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }),
  ).not.toBeNull();
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).sleepStart,
  ).toBe("23:00");
});

it("blocks invalid start dates in the new planned dialog and permits an intentional clear", () => {
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  const editor = within(screen.getByRole("dialog"));
  fireEvent.click(editor.getByRole("tab", { name: "Planned" }));
  setDateField(editor.getByRole("group", { name: "Start date" }), "01/01/1800");
  expect(editor.getByText("Enter a valid start date.")).not.toBeNull();
  expect(editor.getByRole("button", { name: "Add mushroom" })).toBeDisabled();
  setDateField(editor.getByRole("group", { name: "Start date" }), "");
  expect(
    editor.getByRole("button", { name: "Add mushroom" }),
  ).not.toBeDisabled();
});

it("can turn an unsaved planned draft into an in-progress manual battle", () => {
  render(
    <MushroomPlanner
      resumeDraft={{
        id: "unsaved",
        title: "New park",
        type: "Small Blue Mushroom",
        endAt: "2026-11-04T12:00:00Z",
        source: "hypothetical",
        status: "planned",
        tryDay: "2026-10-31",
      }}
    />,
  );
  const editor = within(screen.getByRole("dialog", { name: "Add mushroom" }));
  fireEvent.click(editor.getByRole("tab", { name: "In progress" }));
  fireEvent.change(editor.getByRole("textbox", { name: "Days" }), {
    target: { value: "2" },
  });
  fireEvent.click(editor.getByRole("button", { name: "Add mushroom" }));
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.find(
      (record: { id: string }) => record.id === "unsaved",
    ),
  ).toMatchObject({ source: "manual", status: "running" });
});


it("lets an uploaded mushroom count toward its optional start date and clears that count when the date is removed", () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-30T17:00:00Z"));
  render(<MushroomPlanner />);
  fireEvent.click(screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }));
  let editor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
  setDateField(editor.getByRole("group", { name: "Start date" }), "10/30/2026");
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  expect(dailyChip("Oct 30 · 1/3")).not.toBeNull();
  expect(JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes.find((record: { id: string }) => record.id === "IMG_4082").tryDay).toBe("2026-10-30");
  fireEvent.click(screen.getByRole("button", { name: "Edit Prien Lake Mall East Entrance" }));
  editor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
  setDateField(editor.getByRole("group", { name: "Start date" }), "");
  fireEvent.click(editor.getByRole("button", { name: "Save" }));
  expect(dailyChip("Oct 30 · 0/3")).not.toBeNull();
  expect(screen.queryByRole("button", { name: /^Restore / })).toBeNull();
});
