import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import AppNotice from "./AppNotice";

beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

it("keeps errors available until dismissed", () => {
  const onClose = jest.fn();
  render(<AppNotice message="Could not save" severity="error" onClose={onClose} />);
  act(() => { jest.advanceTimersByTime(30000); });
  expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
  fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(onClose).toHaveBeenCalledTimes(1);
});
it("keeps a warning dismissed until a new event needs review", () => {
  const { rerender } = render(<AppNotice message="Check the countdown" severity="warning" noticeKey={1} />);
  fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
  rerender(<AppNotice message="Check the countdown" severity="warning" noticeKey={1} />);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  rerender(<AppNotice message="Check the countdown" severity="warning" noticeKey={2} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Check the countdown");
});
it("keeps field-review actions visible until the user dismisses or resolves them", () => {
  const onReview = jest.fn();
  render(<AppNotice message="Check the countdown" severity="error" action={<button onClick={onReview}>Review</button>} />);
  act(() => { jest.advanceTimersByTime(30000); });
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  expect(onReview).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeInTheDocument();
});
