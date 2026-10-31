import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ActionFeedback, { ActionFeedbackProvider } from "./ActionFeedback";

beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

it("shows a temporary snackbar with Undo and expires after five seconds", () => {
  const onUndo = jest.fn(), onClose = jest.fn();
  render(<ActionFeedback message="Mushroom saved" onClose={onClose} action={<button onClick={onUndo}>Undo</button>} />);
  expect(screen.getByRole("status")).toHaveTextContent("Mushroom saved");
  act(() => { jest.advanceTimersByTime(4999); });
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(onUndo).toHaveBeenCalledTimes(1);
  act(() => { jest.advanceTimersByTime(1); });
  expect(screen.queryByText("Mushroom saved")).not.toBeInTheDocument();
  expect(onClose).toHaveBeenCalledTimes(1);
});
it("gives repeated saves their own timeout instead of inheriting the previous timer", () => {
  const { rerender } = render(<ActionFeedback message="Mushroom saved" noticeKey={1} />);
  act(() => { jest.advanceTimersByTime(4000); });
  rerender(<ActionFeedback message="Mushroom saved" noticeKey={2} />);
  act(() => { jest.advanceTimersByTime(4000); });
  expect(screen.getByText("Mushroom saved")).toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.queryByText("Mushroom saved")).not.toBeInTheDocument();
});
it("pauses while a user focuses Undo, then resumes when focus leaves", () => {
  render(<ActionFeedback message="Mushroom saved" action={<button>Undo</button>} />);
  fireEvent.focus(screen.getByRole("button", { name: "Undo" }));
  act(() => { jest.advanceTimersByTime(20000); });
  expect(screen.getByText("Mushroom saved")).toBeInTheDocument();
  fireEvent.blur(screen.getByRole("button", { name: "Undo" }));
  act(() => { jest.advanceTimersByTime(2500); });
  expect(screen.queryByText("Mushroom saved")).not.toBeInTheDocument();
});
it("shows only the latest feedback and does not resurrect a superseded message", () => {
  render(<ActionFeedbackProvider>
    <ActionFeedback message="Mushroom saved" />
    <ActionFeedback message="Copied" />
  </ActionFeedbackProvider>);
  expect(screen.queryByText("Mushroom saved")).not.toBeInTheDocument();
  expect(screen.getByText("Copied")).toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(5000); });
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("allows early dismissal without calling close again at the timeout", () => {
  const onClose = jest.fn();
  render(<ActionFeedback message="Copy failed" severity="error" onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
  act(() => { jest.advanceTimersByTime(10000); });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(onClose).toHaveBeenCalledTimes(1);
});
