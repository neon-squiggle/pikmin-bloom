import { act, renderHook } from "@testing-library/react";
import {
  BattleScreenshotResult,
  readBattleScreenshot,
} from "./readBattleScreenshot";
import useScreenshotReader, {
  SCREENSHOT_READ_TIMEOUT_MS,
} from "./useScreenshotReader";

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
  const promise = new Promise<BattleScreenshotResult>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
beforeEach(() => read.mockReset());
afterEach(() => jest.useRealTimers());

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
    { timedOut: false, message: "Invalid image" },
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
