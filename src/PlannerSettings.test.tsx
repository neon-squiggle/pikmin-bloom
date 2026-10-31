import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import PlannerSettings from "./PlannerSettings";
import { emptyPlanner } from "./stagePlanner";

it("keeps save recovery and backup controls available until saving succeeds", () => {
  const retry = jest.fn();
  const props = { state: emptyPlanner("UTC"), month: "2026-11", onChange: jest.fn(), onImport: jest.fn(), onRetry: retry };
  const view = render(<PlannerSettings {...props} storageError />);
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Changes could not be saved");
  expect(screen.getByRole("button", { name: "Export plan" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry save" }));
  expect(retry).toHaveBeenCalledTimes(1);
  view.rerender(<PlannerSettings {...props} storageError={false} />);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
