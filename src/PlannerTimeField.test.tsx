import { setDateField, readDateField } from "./testFixtures/dateFields";
import { render, screen } from "@testing-library/react";
import PlannerTimeField from "./PlannerTimeField";

it("edits a recurring sleep clock with the shared picker and preserves 24-hour storage", () => {
  const change = jest.fn();
  render(
    <PlannerTimeField label="Sleep from" value="23:00" onChange={change} />,
  );
  const field = screen.getByRole("group", {
    name: "Sleep from",
  });
  expect(readDateField(field)).toBe("11:00 PM");
  setDateField(field, "11:30 PM");
  expect(change).toHaveBeenLastCalledWith("23:30");
  setDateField(field, "");
  expect(change).toHaveBeenLastCalledWith("");
});

it("updates saved clock changes without interpreting them as an instant on a daylight-saving date", () => {
  const change = jest.fn();
  const view = render(
    <PlannerTimeField label="Sleep until" value="07:00" onChange={change} />,
  );
  const field = screen.getByRole("group", {
    name: "Sleep until",
  });
  expect(readDateField(field)).toBe("07:00 AM");
  view.rerender(
    <PlannerTimeField label="Sleep until" value="02:30" onChange={change} />,
  );
  expect(readDateField(field)).toBe("02:30 AM");
  expect(change).not.toHaveBeenCalled();
});
