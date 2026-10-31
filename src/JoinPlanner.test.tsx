import { setDateField, readDateField } from "./testFixtures/dateFields";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import JoinPlanner from "./JoinPlanner";
const reference = dayjs("2024-01-01T12:00:00");
const show = (
  variant: "planned" | "in-progress" = "in-progress",
  start = reference,
  expand = true,
) => {
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <JoinPlanner
        variant={variant}
        currentAp={100}
        healthRemaining={3000}
        referenceTime={start}
        baselineEndTime={start.add(1, "hour")}
        initialTargetEndTime={start.add(45, "minute")}
      />
    </LocalizationProvider>,
  );
  if (expand)
    fireEvent.click(screen.getByRole("button", { name: "Additional players" }));
};
const value = (name: string) =>
  name.includes("time") ? readDateField(screen.getByRole("group", { name })) : (screen.getByRole("textbox", { name }) as HTMLInputElement).value;
it("keeps additional-player planning collapsed by default", () => {
  show("planned", reference, false);
  expect(
    screen
      .getByRole("button", { name: "Additional players" })
      .getAttribute("aria-expanded"),
  ).toBe("false");
  expect(screen.queryByRole("slider")).toBeNull();
});
it("recomputes AP when bullhorn time is delayed and exposes time and AP to assistive technology", () => {
  show();
  expect(value("Additional AP")).toBe("11.111");
  fireEvent.change(screen.getByRole("slider"), { target: { value: "600" } });
  expect(value("Bullhorn time")).toBe("01/01/2024 12:10:00 PM");
  expect(value("Additional AP")).toBe("14.286");
  expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toContain(
    "12:10:00 PM · 14.286 AP",
  );
});
it("updates bullhorn time from a feasible AP entry and explains an impossible entry", () => {
  show();
  fireEvent.change(screen.getByLabelText("Additional AP"), {
    target: { value: "20" },
  });
  expect(value("Bullhorn time")).toBe("01/01/2024 12:20:00 PM");
  expect(screen.queryByText("Bullhorn time adjusted")).toBeNull();
  fireEvent.change(screen.getByLabelText("Additional AP"), {
    target: { value: "1" },
  });
  expect(
    screen.getByText("This AP cannot meet the desired end time."),
  ).not.toBeNull();
  expect(value("Additional AP")).toBe("1");
});
it.each(["planned", "in-progress"] as const)(
  "edits join time, divides AP and copies timestamps for %s",
  (variant) => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    show(variant);
    setDateField(screen.getByRole("group", { name: "Bullhorn time" }), "01/01/2024 12:10:00 PM");
    fireEvent.click(screen.getByRole("button", { name: "4 joining players" }));
    expect(screen.getByTestId("divided-ap-result").textContent).toBe(
      "3.572 AP each",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy Bullhorn time Discord timestamp",
      }),
    );
    expect(writeText).toHaveBeenCalledWith(
      `<t:${reference.add(10, "minute").unix()}:f>`,
    );
  },
);
it.each([
  "01/01/2024 11:59:59 AM",
  "01/01/2024 12:45:00 PM",
  "",
  "01/01/2024 hh:10:00 PM",
])(
  "keeps invalid bullhorn input visible with contextual feedback: %s",
  (input) => {
    show();
    setDateField(screen.getByRole("group", { name: "Bullhorn time" }), input);
    expect(screen.getByText(/Choose a time from/)).not.toBeNull();
    setDateField(screen.getByRole("group", { name: "Bullhorn time" }), "01/01/2024 12:20:00 PM");
    expect(value("Additional AP")).toBe("20");
  },
);
it.each(["01/01/2024 11:00 AM", "01/01/2024 02:00 PM"])(
  "explains impossible desired finishes: %s",
  (input) => {
    show();
    setDateField(screen.getByRole("group", { name: "Desired end time" }), input);
    expect(
      screen.getByText(/Choose an end time (after|before)/),
    ).not.toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
  },
);
it("allows the last second before a next-day desired finish", () => {
  show("planned", dayjs("2024-01-01T23:30:00"));
  setDateField(screen.getByRole("group", { name: "Bullhorn time" }), "01/02/2024 12:14:59 AM");
  expect(value("Additional AP")).toBe("30,000");
  expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("2699");
});
