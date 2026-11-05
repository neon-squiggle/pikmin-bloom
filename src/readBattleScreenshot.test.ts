import { createWorker } from "tesseract.js";
import { readBattleNumber } from "./readBattleNumber";
import { readBattleScreenshot } from "./readBattleScreenshot";
import { locateBattleFields, cropBattleCountdown } from "./screenshotImage";

jest.mock("tesseract.js", () => ({
  createWorker: jest.fn(),
  PSM: { SINGLE_LINE: "7", SINGLE_BLOCK: "6" },
}));
jest.mock("./readBattleNumber", () => ({ readBattleNumber: jest.fn() }));
jest.mock("exifr", () => ({
  parse: async () => ({ DateTimeOriginal: "2026-10-30T17:00:00Z" }),
}));
jest.mock("./screenshotImage", () => {
  const pixels = () => ({
    width: 1,
    height: 1,
    data: new Uint8ClampedArray(4),
  });
  return {
    findStatsRegion: () => ({}),
    locateBattleFields: jest.fn(() => ({ health: {}, ap: {}, countdown: {} })),
    cropBattleCountdown: jest.fn(pixels),
    cropTitleField: pixels,
    cropMushroomTypeField: pixels,
  };
});
const recognize = jest.fn();
const numericResult = (text: string, confidence: number) => ({
  data: {
    text,
    confidence: 99,
    blocks: [
      {
        paragraphs: [
          {
            lines: [
              {
                words: [
                  {
                    text,
                    confidence: 99,
                    symbols: Array.from(text).map((digit) => ({
                      text: digit,
                      confidence,
                    })),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});
let originalCreate: typeof URL.createObjectURL;
let originalRevoke: typeof URL.revokeObjectURL;
beforeEach(() => {
  recognize.mockReset();
  (readBattleNumber as jest.Mock).mockReset().mockImplementation((_, __, field) => ({
    text: field === "health" ? "399,006" : "1821", value: field === "health" ? 399006 : 1821, score: 0.99,
  }));
  (cropBattleCountdown as jest.Mock).mockImplementation(() => ({ width: 1, height: 1, data: new Uint8ClampedArray(4) }));
  (locateBattleFields as jest.Mock).mockReturnValue({ health: {}, ap: {}, countdown: {} });
  (createWorker as jest.Mock).mockReset().mockResolvedValue({
    recognize,
    setParameters: jest.fn().mockResolvedValue(undefined),
    terminate: jest.fn().mockResolvedValue(undefined),
  });
  jest
    .spyOn(window, "Image")
    .mockImplementation(
      () =>
        ({
          width: 400,
          height: 800,
          decode: async () => {},
        }) as HTMLImageElement,
    );
  jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: jest.fn(),
    getImageData: () => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    }),
    createImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: jest.fn(),
  } as unknown as CanvasRenderingContext2D);
  originalCreate = URL.createObjectURL;
  originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(() => "blob:test");
  URL.revokeObjectURL = jest.fn();
});
afterEach(() => {
  jest.restoreAllMocks();
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
});

it("leaves uncertain numeric fields blank while retaining confident fields and identity", async () => {
  (readBattleNumber as jest.Mock).mockReturnValueOnce(null)
    .mockReturnValueOnce({ text: "10", value: 10, score: 0.99 });
  recognize
    .mockResolvedValueOnce(numericResult("2 days 0 hrs 38 mins 26 secs", 60))
    .mockResolvedValueOnce({
      data: { text: "Die trauernde Frau", confidence: 3 },
    })
    .mockResolvedValueOnce({
      data: { text: "Small White Mushroom", confidence: 3 },
    });
  const result = await readBattleScreenshot(
    new File(["pixels"], "battle.png", { type: "image/png" }),
    new AbortController().signal,
    jest.fn(),
    true,
  );
  expect(result.warnings).toEqual([
    "Couldn't confidently read remaining health. Enter it manually.",
    "Couldn't confidently read countdown. Enter it manually.",
  ]);
  expect(result.healthRemaining).toBeNull();
  expect(result.currentAp).toBe(10);
  expect(result.countdown).toBeNull();
  expect(result.title).toBe("Die trauernde Frau");
  expect(result.mushroomType).toBe("Small White Mushroom");
  expect(
    recognize.mock.calls.slice(0, 1).every((call) => call[2]?.blocks === true),
  ).toBe(true);
  expect(
    recognize.mock.calls.slice(1).every((call) => call[2] === undefined),
  ).toBe(true);
});

it("does not fall back to generic OCR when a whole-number font match is ambiguous", async () => {
  (readBattleNumber as jest.Mock).mockReturnValueOnce({ text: "399,006", value: 399006, score: 0.99 })
    .mockReturnValueOnce(null);
  recognize.mockResolvedValueOnce(numericResult("6 hrs. 5 mins. 11 secs. left", 99));
  const result = await readBattleScreenshot(
    new File(["pixels"], "battle.png", { type: "image/png" }),
    new AbortController().signal, jest.fn(),
  );
  expect(result.healthRemaining).toBe(399006);
  expect(result.currentAp).toBeNull();
  expect(result.countdown).toEqual({ days: 0, hours: 6, minutes: 5, seconds: 11 });
  expect(result.warnings).toContain("Couldn't confidently read AP. Enter it manually.");
  expect(recognize).toHaveBeenCalledTimes(1);
});

it("rejects malformed four-number countdowns even when OCR reports high confidence", async () => {
  recognize.mockResolvedValueOnce(numericResult("2 days 0 hrs Bmins 38 secs 26", 99));
  const result = await readBattleScreenshot(
    new File(["pixels"], "battle.png", { type: "image/png" }),
    new AbortController().signal, jest.fn(),
  );
  expect(result.countdown).toBeNull();
  expect(result.warnings).toContain("Couldn't read countdown. Enter it manually.");
});

it("requests manual entry before OCR when the battle icons cannot be located", async () => {
  (locateBattleFields as jest.Mock).mockReturnValue({});
  await expect(readBattleScreenshot(
    new File(["pixels"], "battle.png", { type: "image/png" }),
    new AbortController().signal,
    jest.fn(),
  )).rejects.toThrow(/Couldn't locate the health and AP icons/);
  expect(createWorker).not.toHaveBeenCalled();
});
