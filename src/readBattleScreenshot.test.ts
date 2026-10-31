import { createWorker } from "tesseract.js";
import { readBattleScreenshot } from "./readBattleScreenshot";

jest.mock("tesseract.js", () => ({
  createWorker: jest.fn(),
  PSM: { SINGLE_LINE: "7", SINGLE_BLOCK: "6" },
}));
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
    maskBattleField: pixels,
    maskTitleField: pixels,
    cropIdentityField: pixels,
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
  (createWorker as jest.Mock).mockResolvedValue({
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

it("requests digit confidence for stats and warns only for uncertain numeric readings", async () => {
  recognize
    .mockResolvedValueOnce(numericResult("17510", 60))
    .mockResolvedValueOnce(numericResult("10", 99))
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
    "Check remaining health; some digits were unclear.",
    "Check countdown; some digits were unclear.",
  ]);
  expect(result.title).toBe("Die trauernde Frau");
  expect(result.mushroomType).toBe("Small White Mushroom");
  expect(
    recognize.mock.calls.slice(0, 3).every((call) => call[2]?.blocks === true),
  ).toBe(true);
  expect(
    recognize.mock.calls.slice(3).every((call) => call[2] === undefined),
  ).toBe(true);
});
