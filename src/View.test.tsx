import { setDateField, readDateField } from "./testFixtures/dateFields";
import "@testing-library/jest-dom";
import { initialPlannerFinishes } from "./testFixtures/screenshotMushrooms";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import View from "./View";
import { PLANNER_STORAGE_KEY } from "./stagePlanner";
const seedPlan = () =>
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      finishes: [
        ...initialPlannerFinishes(),
        {
          ...initialPlannerFinishes()[0],
          id: "planned-park",
          title: "Planned park",
          source: "hypothetical",
          status: "planned",
          capturedAt: undefined,
        },
      ],
    }),
  );

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ version: 3, finishes: initialPlannerFinishes() }),
  );
});

it("opens the calculator by default and preserves inputs across calendar visits", () => {
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <View />
    </LocalizationProvider>,
  );

  expect(
    screen
      .getByRole("tab", { name: "Calculator" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  fireEvent.change(screen.getByRole("textbox", { name: "AP" }), {
    target: { value: "350" },
  });

  fireEvent.click(screen.getByRole("tab", { name: "Planner" }));
  expect(
    screen
      .getAllByRole("button", { name: /^Edit / })
      .map((button) => button.getAttribute("aria-label")),
  ).toEqual([
    "Edit Prien Lake Mall East Entrance",
    "Edit Harbour Town Park Nth Entrance.",
    "Edit Die trauernde Frau",
    "Edit Pilgrim Baptist Church",
    "Edit Circle Bench",
  ]);
  expect(screen.getByText("Giant Halloween Mushroom")).not.toBeNull();
  expect(screen.getAllByRole("region", { name: /^Step / })).toHaveLength(16);

  fireEvent.click(screen.getByRole("tab", { name: "Calculator" }));
  expect(
    (screen.getByRole("textbox", { name: "AP" }) as HTMLInputElement).value,
  ).toBe("350");
});

it("uses labeled bottom navigation on phones and keeps both battle drafts", () => {
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes("max-width:599.95px"),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  const scrollTo = jest.spyOn(window, "scrollTo").mockImplementation(() => {});

  try {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <View />
      </LocalizationProvider>,
    );
    const navigation = within(
      screen.getByRole("navigation", { name: "Main navigation" }),
    );
    expect(
      screen.queryByRole("tablist", { name: "Mushroom tools" }),
    ).toBeNull();
    expect(
      navigation
        .getByRole("button", { name: "Calculator" })
        .getAttribute("aria-current"),
    ).toBe("page");
    fireEvent.change(screen.getByRole("textbox", { name: "AP" }), {
      target: { value: "350" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Plan a battle in progress" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Health remaining" }),
      { target: { value: "17510" } },
    );
    fireEvent.change(screen.getByRole("textbox", { name: "AP" }), {
      target: { value: "10" },
    });

    fireEvent.click(navigation.getByRole("button", { name: "Planner" }));
    expect(
      navigation
        .getByRole("button", { name: "Planner" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.queryByRole("table")).toBeNull();
    const finishes = screen.getAllByRole("button", { name: /^Edit / });
    expect(finishes).toHaveLength(5);
    [
      "Prien Lake Mall East Entrance",
      "Harbour Town Park Nth Entrance.",
      "Die trauernde Frau",
      "Pilgrim Baptist Church",
      "Circle Bench",
    ].forEach((title, index) => {
      expect(finishes[index].getAttribute("aria-label")).toBe(`Edit ${title}`);
    });

    fireEvent.click(navigation.getByRole("button", { name: "Calculator" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Health remaining",
        }) as HTMLInputElement
      ).value,
    ).toBe("17,510");
    expect(
      (screen.getByRole("textbox", { name: "AP" }) as HTMLInputElement).value,
    ).toBe("10");
    fireEvent.click(screen.getByRole("button", { name: "Plan a new battle" }));
    expect(
      (screen.getByRole("textbox", { name: "AP" }) as HTMLInputElement).value,
    ).toBe("350");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  } finally {
    window.matchMedia = originalMatchMedia;
    scrollTo.mockRestore();
  }
});

it("round-trips an optional start calculation and restores the ordinary calculator draft", () => {
  seedPlan();
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <View />
    </LocalizationProvider>,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "AP" }), {
    target: { value: "350" },
  });
  fireEvent.click(screen.getByRole("tab", { name: "Planner" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit Planned park" }));
  const editor = within(screen.getByRole("dialog", { name: "Edit mushroom" }));
  expect(
    editor.getByRole("button", { name: "Calculate start time" }),
  ).not.toBeNull();
  fireEvent.click(editor.getByRole("button", { name: "Calculate start time" }));
  expect(
    screen
      .getByRole("tab", { name: "Calculator" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  expect(
    (screen.getByRole("radio", { name: "Start time" }) as HTMLInputElement)
      .checked,
  ).toBe(true);
  fireEvent.change(screen.getByRole("textbox", { name: "AP" }), {
    target: { value: "100" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Use in planner" }));
  expect(
    screen.getByRole("tab", { name: "Planner" }).getAttribute("aria-selected"),
  ).toBe("true");
  expect(screen.getByText(/^Start time: [A-Z][a-z]{2} \d/)).not.toBeNull();
  const records = JSON.parse(
    localStorage.getItem("pikmin-bloom:stage-planner:v1")!,
  ).finishes;
  expect(records).toHaveLength(6);
  expect(
    records.find((record: { id: string }) => record.id === "planned-park")
      .plannedAp,
  ).toBe(100);
  fireEvent.click(screen.getByRole("tab", { name: "Calculator" }));
  expect(
    (screen.getByRole("textbox", { name: "AP" }) as HTMLInputElement).value,
  ).toBe("350");
});

it("cancels a start plan without changing records and restores the editor draft", () => {
  seedPlan();
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <View />
    </LocalizationProvider>,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Planner" }));
  const original = JSON.parse(
    localStorage.getItem("pikmin-bloom:stage-planner:v1")!,
  ).finishes;
  fireEvent.click(screen.getByRole("button", { name: "Edit Planned park" }));
  const editor = within(screen.getByRole("dialog"));
  fireEvent.change(editor.getByRole("textbox", { name: "Title" }), {
    target: { value: "Unsaved place" },
  });
  fireEvent.click(editor.getByRole("button", { name: "Calculate start time" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Cancel start-time plan" }),
  );
  expect(
    JSON.parse(localStorage.getItem("pikmin-bloom:stage-planner:v1")!).finishes,
  ).toEqual(original);
  expect(
    (
      within(screen.getByRole("dialog")).getByRole("textbox", {
        name: "Title",
      }) as HTMLInputElement
    ).value,
  ).toBe("Unsaved place");
});

it("keeps a named daily try's calculated start beneath its single editable end entry", async () => {
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <View />
    </LocalizationProvider>,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Planner" }));
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("tab", { name: "Planned" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
    target: { value: "Canal bridge" },
  });
  setDateField(screen.getByRole("group", { name: /^End time/ }), "11/02/2026 12:00:00 PM");
  fireEvent.click(screen.getByRole("checkbox", { name: "Mushroom ticket" }));
  fireEvent.click(screen.getByRole("button", { name: "Calculate start time" }));
  expect(
    JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!).finishes,
  ).toHaveLength(5);
  expect(screen.getByText("Canal bridge")).not.toBeNull();
  expect(
    (screen.getByRole("radio", { name: "Start time" }) as HTMLInputElement)
      .checked,
  ).toBe(true);
  fireEvent.change(screen.getByRole("combobox", { name: "Mushroom type" }), {
    target: { value: "Small Red" },
  });
  fireEvent.click(screen.getByRole("option", { name: "Small Red" }));
  fireEvent.change(screen.getByRole("textbox", { name: "AP" }), {
    target: { value: "100" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Use in planner" }));
  const records = JSON.parse(
    localStorage.getItem(PLANNER_STORAGE_KEY)!,
  ).finishes;
  expect(records).toHaveLength(6);
  expect(records[5]).toMatchObject({
    title: "Canal bridge",
    source: "hypothetical",
    usesFreeTry: false,
    plannedAp: 100,
  });
  expect(records[5].startAt).toBeTruthy();
  expect(screen.getByText(/^Start time: /)).not.toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "End times" }));
  const end = within(screen.getByRole("listitem", { name: "Canal bridge" }));
  expect(end.getByText("Canal bridge")).not.toBeNull();
  expect(end.getByText(/^Start time: /)).not.toBeNull();
  expect(screen.queryByRole("button", { name: /^Edit start for / })).toBeNull();
  expect(
    within(
      screen.getByRole("list", { name: "Mushroom end times" }),
    ).getAllByRole("button", { name: /^Edit / }),
  ).toHaveLength(records.length);
  const editButton = end.getByRole("button", { name: "Edit Canal bridge" });
  fireEvent.click(editButton);
  expect(
    (
      within(screen.getByRole("dialog")).getByRole("textbox", {
        name: "Title",
      }) as HTMLInputElement
    ).value,
  ).toBe("Canal bridge");
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }),
  );
  await waitFor(() => expect(editButton).toHaveFocus());
});

it("restores an unsaved planned draft when its start calculation is canceled", () => {
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <View />
    </LocalizationProvider>,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Planner" }));
  fireEvent.click(screen.getByRole("button", { name: "Add mushrooms" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Add manually" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("tab", { name: "Planned" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
    target: { value: "Canal bridge draft" },
  });
  const end = readDateField(screen.getByRole("group", { name: /^End time/ }));
  const original = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!);
  fireEvent.click(screen.getByRole("button", { name: "Calculate start time" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Cancel start-time plan" }),
  );
  expect(screen.getByRole("dialog", { name: "Add mushroom" })).toBeInTheDocument();
  expect(
    (screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement).value,
  ).toBe("Canal bridge draft");
  expect(
    readDateField(screen.getByRole("group", { name: /^End time/ })),
  ).toBe(end);
  expect(JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)!)).toEqual(
    original,
  );
});

it("keeps in-progress inputs when resizing between desktop tabs and mobile navigation", () => {
  const original = window.matchMedia;
  const scroll = jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  let mobile = false;
  const listeners = new Set<() => void>();
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    get matches() {
      return query.includes("max-width:599.95px")
        ? mobile
        : query.includes("min-width: 600px")
          ? !mobile
          : false;
    },
    media: query,
    onchange: null,
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
    dispatchEvent: jest.fn(),
  }));
  try {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <View />
      </LocalizationProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Plan a battle in progress" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Health remaining" }),
      { target: { value: "17510" } },
    );
    act(() => {
      mobile = true;
      Array.from(listeners).forEach((listener) => listener());
    });
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).not.toBeNull();
    expect(
      (
        screen.getByRole("textbox", {
          name: "Health remaining",
        }) as HTMLInputElement
      ).value,
    ).toBe("17,510");
    act(() => {
      mobile = false;
      Array.from(listeners).forEach((listener) => listener());
    });
    expect(
      screen.getByRole("tablist", { name: "Mushroom tools" }),
    ).not.toBeNull();
    expect(
      (
        screen.getByRole("textbox", {
          name: "Health remaining",
        }) as HTMLInputElement
      ).value,
    ).toBe("17,510");
  } finally {
    window.matchMedia = original;
    scroll.mockRestore();
  }
});
