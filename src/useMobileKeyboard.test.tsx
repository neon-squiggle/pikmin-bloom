import { act, render, screen } from "@testing-library/react";
import useMobileKeyboard from "./useMobileKeyboard";

const Harness = () => {
  const keyboard = useMobileKeyboard(true);
  return (
    <>
      <input aria-label="Bottom field" />
      <input aria-label="Next field" />
      <output data-testid="keyboard">{JSON.stringify(keyboard)}</output>
    </>
  );
};
let viewport: EventTarget & {
  height: number;
  offsetTop: number;
  scale: number;
};
const originalViewport = Object.getOwnPropertyDescriptor(
  window,
  "visualViewport",
);
const originalHeight = window.innerHeight;
beforeEach(() => {
  jest.useFakeTimers();
  viewport = Object.assign(new EventTarget(), {
    height: 844,
    offsetTop: 0,
    scale: 1,
  });
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: viewport,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 844,
  });
  jest.spyOn(window, "scrollBy").mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  if (originalViewport)
    Object.defineProperty(window, "visualViewport", originalViewport);
  else
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined,
    });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: originalHeight,
  });
});
const status = () => JSON.parse(screen.getByTestId("keyboard").textContent!);
const focusField = () => {
  const input = screen.getByLabelText("Bottom field");
  jest
    .spyOn(input, "getBoundingClientRect")
    .mockReturnValue({
      top: 732,
      bottom: 780,
      height: 48,
      left: 0,
      right: 320,
      width: 320,
      x: 0,
      y: 732,
      toJSON: () => ({}),
    });
  act(() => {
    input.focus();
    jest.advanceTimersByTime(32);
  });
};

it("reserves actual keyboard overlap, reveals the focused field, and restores space after dismissal", () => {
  const { unmount } = render(<Harness />);
  focusField();
  act(() => {
    viewport.height = 480;
    viewport.dispatchEvent(new Event("resize"));
    jest.advanceTimersByTime(32);
  });
  expect(status()).toEqual({ open: true, bottomInset: 364 });
  expect(window.scrollBy).toHaveBeenCalledWith({ top: 316, behavior: "auto" });
  expect(document.documentElement.hasAttribute("data-keyboard-open")).toBe(
    true,
  );
  act(() => {
    viewport.height = 844;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(status()).toEqual({ open: false, bottomInset: 0 });
  unmount();
  expect(
    document.documentElement.style.getPropertyValue("--keyboard-inset"),
  ).toBe("");
});

it("does not add keyboard height twice when the layout already resized", () => {
  render(<Harness />);
  focusField();
  act(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 480,
    });
    viewport.height = 480;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(status()).toEqual({ open: true, bottomInset: 0 });
  act(() => {
    screen.getByLabelText("Next field").focus();
    jest.advanceTimersByTime(32);
  });
  expect(status().open).toBe(true);
});

it("accounts for a panned visual viewport and ignores pinch zoom", () => {
  render(<Harness />);
  focusField();
  act(() => {
    viewport.height = 480;
    viewport.offsetTop = 100;
    viewport.dispatchEvent(new Event("resize"));
    jest.advanceTimersByTime(32);
  });
  expect(status()).toEqual({ open: true, bottomInset: 264 });
  expect(window.scrollBy).toHaveBeenCalledWith({ top: 216, behavior: "auto" });
});

it("does not mistake zooming for a software keyboard", () => {
  render(<Harness />);
  focusField();
  act(() => {
    viewport.height = 400;
    viewport.scale = 2;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(status()).toEqual({ open: false, bottomInset: 0 });
});
