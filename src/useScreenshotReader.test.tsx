import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useState } from "react";
import {
  BattleScreenshotResult,
  readBattleScreenshot,
} from "./readBattleScreenshot";
import useScreenshotReader, {
  SCREENSHOT_READ_TIMEOUT_MS,
} from "./useScreenshotReader";
import ScreenshotReadingStatus from "./ScreenshotReadingStatus";

jest.mock("./readBattleScreenshot", () => ({
  readBattleScreenshot: jest.fn(),
}));
const read = readBattleScreenshot as jest.MockedFunction<
  typeof readBattleScreenshot
>;
const sample: BattleScreenshotResult = {
  healthRemaining: 100,
  currentAp: 10,
  countdown: { days: 1, hours: 0, minutes: 0, seconds: 0 },
  capturedAt: "2026-10-30T12:00:00Z",
  warnings: [],
  filename: "battle.png",
};
const file = (name: string) =>
  new File(["pixels"], name, { type: "image/png" });
const pending = () => {
  let resolve!: (value: BattleScreenshotResult) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<BattleScreenshotResult>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
};
beforeEach(() => read.mockReset());
afterEach(() => jest.useRealTimers());

it("shows batch progress by finished files, including failures, rather than OCR stage updates", async () => {
  const first = pending(), second = pending(), third = pending();
  read.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise);
  const files = [file("first.png"), file("bad.png"), file("last.png")];
  const onRead = jest.fn(), onError = jest.fn();
  const Batch = () => {
    const { progress, readFiles } = useScreenshotReader();
    const [reviewCount, setReviewCount] = useState(0);
    return <>
      <button onClick={() => void readFiles(files, { onRead, onError: (failure, file) => {
        onError(failure, file);
        setReviewCount((count) => count + 1);
      } })}>Read batch</button>
      <ScreenshotReadingStatus progress={progress} batch reviewCount={reviewCount} />
    </>;
  };
  render(<Batch />);
  fireEvent.click(screen.getByRole("button", { name: "Read batch" }));
  const percent = () => Number(screen.getByRole("progressbar", { name: "Reading screenshots" }).getAttribute("aria-valuenow"));
  expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  expect(screen.getByText("0/3 processed · 0 need review")).not.toBeNull();
  await act(async () => first.resolve(sample));
  expect(percent()).toBe(33);
  expect(screen.getByText("1/3 processed · 0 need review")).not.toBeNull();
  await act(async () => second.reject(new Error("Unreadable")));
  expect(percent()).toBe(67);
  expect(screen.getByText("2/3 processed · 1 needs review")).not.toBeNull();
  act(() => read.mock.calls[2][2]?.("Reading countdown…"));
  expect(percent()).toBe(67);
  await act(async () => third.resolve(sample));
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(onRead).toHaveBeenCalledTimes(2);
  expect(onError).toHaveBeenCalledTimes(1);
});

it("reads a batch sequentially, keeps successful files after a failure, and requests identity only when needed", async () => {
  read
    .mockResolvedValueOnce(sample)
    .mockRejectedValueOnce(new Error("Invalid image"))
    .mockResolvedValueOnce(sample);
  const onRead = jest.fn(),
    onError = jest.fn();
  const { result } = renderHook(() => useScreenshotReader());
  const files = [file("one.png"), file("bad.png"), file("two.png")];
  await act(async () =>
    result.current.readFiles(files, { includeIdentity: true, onRead, onError }),
  );
  expect(onRead.mock.calls.map((call) => call[1].name)).toEqual([
    "one.png",
    "two.png",
  ]);
  expect(onError).toHaveBeenCalledWith(
    { timedOut: false, message: "Invalid image", stage: "Opening screenshot…" },
    files[1],
  );
  expect(read.mock.calls.every((call) => call[3] === true)).toBe(true);
  expect(result.current.reading).toBe(false);
  expect(result.current.progress).toBeNull();
});

it("cancels promptly and ignores late results and progress even if the reader ignores abort", async () => {
  jest.useFakeTimers();
  const job = pending();
  read.mockReturnValueOnce(job.promise);
  const onRead = jest.fn(),
    onError = jest.fn();
  const { result } = renderHook(() => useScreenshotReader());
  let operation!: Promise<void>;
  act(() => {
    operation = result.current.readFiles([file("one.png")], {
      onRead,
      onError,
    });
  });
  expect(result.current.reading).toBe(true);
  act(() => read.mock.calls[0][2]?.("Reading countdown…"));
  expect(result.current.progress?.message).toBe("Reading countdown…");
  await act(async () => {
    result.current.cancel();
    await operation;
  });
  expect(read.mock.calls[0][1]?.aborted).toBe(true);
  expect(result.current.reading).toBe(false);
  await act(async () => {
    job.resolve(sample);
    read.mock.calls[0][2]?.("Late progress");
  });
  expect(onRead).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
  expect(result.current.progress).toBeNull();
  expect(jest.getTimerCount()).toBe(0);
});

it("replacing a queue prevents an old request from overwriting or clearing its successor", async () => {
  const first = pending(),
    second = pending();
  read.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const onRead = jest.fn(),
    onError = jest.fn();
  const { result } = renderHook(() => useScreenshotReader());
  let oldOperation!: Promise<void>, newOperation!: Promise<void>;
  act(() => {
    oldOperation = result.current.readFiles([file("old.png")], {
      onRead,
      onError,
    });
  });
  act(() => {
    newOperation = result.current.readFiles([file("new.png")], {
      onRead,
      onError,
    });
  });
  await act(async () => {
    first.resolve(sample);
    await oldOperation;
  });
  expect(result.current.reading).toBe(true);
  expect(result.current.progress?.filename).toBe("new.png");
  expect(onRead).not.toHaveBeenCalled();
  await act(async () => {
    second.resolve(sample);
    await newOperation;
  });
  expect(onRead).toHaveBeenCalledTimes(1);
  expect(onRead.mock.calls[0][1].name).toBe("new.png");
  expect(onError).not.toHaveBeenCalled();
});

it("times out the active batch without waiting for an unresponsive reader", async () => {
  jest.useFakeTimers();
  read.mockReturnValueOnce(new Promise(() => {}));
  const onRead = jest.fn(),
    onError = jest.fn();
  const { result } = renderHook(() => useScreenshotReader());
  const files = [file("slow.png"), file("later.png")];
  let operation!: Promise<void>;
  act(() => {
    operation = result.current.readFiles(files, { onRead, onError });
  });
  await act(async () => {
    jest.advanceTimersByTime(SCREENSHOT_READ_TIMEOUT_MS);
    await operation;
  });
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ timedOut: true }),
    files[0],
  );
  expect(onRead).not.toHaveBeenCalled();
  expect(read).toHaveBeenCalledTimes(1);
  expect(result.current.reading).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
});

it("unmounting aborts pending work and suppresses result callbacks", async () => {
  const job = pending();
  read.mockReturnValueOnce(job.promise);
  const onRead = jest.fn(),
    onError = jest.fn();
  const { result, unmount } = renderHook(() => useScreenshotReader());
  let operation!: Promise<void>;
  act(() => {
    operation = result.current.readFiles([file("one.png")], {
      onRead,
      onError,
    });
  });
  unmount();
  await act(async () => {
    job.resolve(sample);
    await operation;
  });
  expect(read.mock.calls[0][1]?.aborted).toBe(true);
  expect(onRead).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});

it("retries only failed or unread files after a partial timeout", async () => {
  jest.useFakeTimers();
  const files = [file("done.png"), file("slow.png"), file("later.png")];
  read.mockResolvedValueOnce(sample).mockReturnValueOnce(new Promise(() => {}));
  const onRead = jest.fn(),
    onError = jest.fn();
  const { result } = renderHook(() => useScreenshotReader());
  let operation!: Promise<void>;
  await act(async () => {
    operation = result.current.readFiles(files, { onRead, onError });
  });
  expect(onRead).toHaveBeenCalledTimes(1);
  await act(async () => {
    jest.advanceTimersByTime(SCREENSHOT_READ_TIMEOUT_MS);
    await operation;
  });
  expect(result.current.pendingFiles).toEqual(files.slice(1));
  read.mockResolvedValue(sample);
  await act(async () =>
    result.current.readFiles(result.current.pendingFiles, { onRead, onError }),
  );
  expect(onRead.mock.calls.map((call) => call[1].name)).toEqual([
    "done.png",
    "slow.png",
    "later.png",
  ]);
  expect(result.current.pendingFiles).toEqual([]);
});

it("retains a canceled file while ignoring late completion", async () => {
  const job = pending(),
    current = file("stopped.png");
  read.mockReturnValueOnce(job.promise);
  const { result } = renderHook(() => useScreenshotReader());
  const onRead = jest.fn(),
    onError = jest.fn();
  let operation!: Promise<void>;
  act(() => {
    operation = result.current.readFiles([current], { onRead, onError });
  });
  await act(async () => {
    result.current.cancel();
    await operation;
  });
  expect(result.current.pendingFiles).toEqual([current]);
  await act(async () => job.resolve(sample));
  expect(result.current.pendingFiles).toEqual([current]);
  expect(onRead).not.toHaveBeenCalled();
});
