import {
  parseCaptureTime,
  parseMushroomTitle,
  parseScreenshotCountdown,
  parseStatNumber,
} from "./screenshotParsing";

describe("battle screenshot parsing", () => {
  it.each([
    [" Montour Trail Mile 7\n", "Montour Trail Mile 7"],
    ["  Die   trauernde Frau ", "Die trauernde Frau"],
    ["Place (7) >", "Place (7) >"],
    ["7", "7"],
    ["\n ", null],
  ])("preserves the cropped title %p as %p", (text, expected) => {
    expect(parseMushroomTitle(text)).toBe(expected);
  });

  it.each([
    ["17 510\n", 17510],
    ["745,735", 745735],
    ["40.690", 40690],
    ["369", 369],
    ["１０", 10],
    ["١٢٣", 123],
    ["10 20", null],
    ["1O", null],
    ["10 AP", null],
    ["", null],
    ["0", null],
  ])("parses the stat %p as %p", (text, expected) => {
    expect(parseStatNumber(text)).toBe(expected);
  });

  it("reads the sample timer and corrects an OCR O in a numeric slot", () => {
    expect(
      parseScreenshotCountdown("2 days O hrs. 38 mins. 26 secs. left"),
    ).toEqual({
      days: 2,
      hours: 0,
      minutes: 38,
      seconds: 26,
    });
  });

  it("accepts four numeric units in another language", () => {
    expect(parseScreenshotCountdown("4 Tage 17 Std. 1 Min. 38 Sek.")).toEqual({
      days: 4,
      hours: 17,
      minutes: 1,
      seconds: 38,
    });
  });

  it("identifies omitted units only when labels make them unambiguous", () => {
    expect(parseScreenshotCountdown("8 mins. 16 secs. left")).toEqual({
      days: 0,
      hours: 0,
      minutes: 8,
      seconds: 16,
    });
    expect(parseScreenshotCountdown("8 xxx 16 yyy")).toBeNull();
    expect(parseScreenshotCountdown("2 days 25 hrs 5 mins 4 secs")).toBeNull();
    expect(parseScreenshotCountdown("2 hrs 4 hrs")).toBeNull();
    expect(parseScreenshotCountdown("0 secs left")).toBeNull();
  });

  it("preserves an embedded timezone offset instead of using upload time", () => {
    expect(
      parseCaptureTime({
        DateTimeOriginal: "2026:10:30 10:56:19",
        OffsetTimeOriginal: "-07:00",
      }),
    ).toBe("2026-10-30T17:56:19.000Z");
  });

  it("uses the browser timezone for a capture time without an offset", () => {
    expect(parseCaptureTime({ DateTimeOriginal: "2026:10:30 10:56:19" })).toBe(
      new Date(2026, 9, 30, 10, 56, 19).toISOString(),
    );
  });

  it("does not substitute modification dates or silently repair invalid dates", () => {
    expect(parseCaptureTime({ ModifyDate: "2026:10:30 10:56:19" })).toBeNull();
    expect(
      parseCaptureTime({ DateTimeOriginal: "2026:02:30 10:56:19" }),
    ).toBeNull();
    expect(
      parseCaptureTime({ DateTimeOriginal: "2026:10:30 25:56:19" }),
    ).toBeNull();
    expect(parseCaptureTime({})).toBeNull();
  });
});
