import { inflateSync } from "zlib";
import { createHash } from "crypto";
import fixtures from "./testFixtures/battleNumberVerificationPixels.json";
import { isApInk, isHealthRed } from "./battleStatAnchors";
import { readBattleNumber } from "./readBattleNumber";
import font from "./battleNumberFont.json";

const pixelsFor = (fixture: typeof fixtures[number]) => ({
  width: fixture.width, height: fixture.height,
  data: new Uint8ClampedArray(inflateSync(Buffer.from(fixture.data, "base64"))),
});
const regionFor = (fixture: typeof fixtures[number]) => ({
  left: 0, top: 0, width: fixture.width, height: fixture.height,
  unit: fixture.unit, inkHue: fixture.inkHue,
});

it.each(fixtures)("reads original $filename $field pixels that were not used to sample the font", (fixture) => {
  const pixels = pixelsFor(fixture);
  const before = createHash("sha256").update(pixels.data).digest("hex");
  const result = readBattleNumber(pixels, regionFor(fixture), fixture.field as "health" | "ap");
  expect(result?.value).toBe(fixture.expected);
  expect(createHash("sha256").update(pixels.data).digest("hex")).toBe(before);
});

it("covers all ten digits in independent original screenshots", () => {
  expect(new Set(fixtures.map((fixture) => String(fixture.expected)).join(""))).toEqual(new Set("0123456789"));
});

// These round trips test sequence length/spacing and comma handling. The
// independent native-pixel tests above verify the actual font recognition.
it.each([1, 12, 103, 1004, 10005, 100006, 1000007, 12345678])(
  "reads a new number without a digit-count ceiling: %p", (value) => {
    const text = new Intl.NumberFormat("en-US").format(value);
    const unit = 2, start = 8, y0 = 5;
    const advance = (c: string) => c === "," ? font.commaAdvance : font.digitAdvance;
    const width = Math.ceil((start + Array.from(text).reduce((n, c) => n + advance(c), 0) + 10) * unit);
    const height = 53 * unit, data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) data.set([50, 110, 100, 255], i);
    let cursor = start;
    for (const character of text) {
      const bitmap = font.glyphs[character as keyof typeof font.glyphs].split("\n");
      for (let y = 0; y < bitmap.length * unit; y++) for (let x = 0; x < bitmap[0].length * unit; x++) {
        const pixel = bitmap[Math.floor(y / unit)][Math.floor(x / unit)];
        if (pixel !== ".") data.set(pixel === "#" ? [255, 90, 100, 255] : [255, 255, 255, 255],
          ((y0 * unit + y) * width + Math.round(cursor * unit) + x) * 4);
      }
      cursor += advance(character);
    }
    expect(readBattleNumber({ data, width, height }, { left: 0, top: 0, width, height, unit }, "health")?.value)
      .toBe(value);
  },
);

it.each([0, 2])("rejects an erased character cell instead of reading a shorter HP number (cell %p)", (cell) => {
  const fixture = fixtures[0], pixels = pixelsFor(fixture), region = regionFor(fixture);
  // First digit, or the first digit after the comma. Keep the later cells.
  const left = Math.floor((8 + (cell ? 26.25 + 16.5 : 0)) * fixture.unit);
  const right = Math.ceil(left + 26.25 * fixture.unit);
  for (let y = 0; y < pixels.height; y++) for (let x = left; x < right; x++)
    pixels.data.set([40, 100, 80, 255], (y * pixels.width + x) * 4);
  expect(readBattleNumber(pixels, region, "health")).toBeNull();
});

it("does not mistake an unreadable trailing glyph's outline for the end of a shorter number", () => {
  const fixture = fixtures.find((fixture) => fixture.field === "ap")!;
  const pixels = pixelsFor(fixture), region = regionFor(fixture);
  // Use the original 637 glyphs as red HP. Erase only the final digit's
  // fill, retaining its white outline; accepting 63 would lose a digit.
  for (let y = 0; y < pixels.height; y++) for (let x = 0; x < pixels.width; x++) {
    const i = (y * pixels.width + x) * 4;
    if (isApInk(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2], fixture.inkHue!))
      pixels.data.set([255, 90, 100, 255], i);
  }
  expect(readBattleNumber(pixels, region, "health")?.value).toBe(637);
  for (let y = 0; y < pixels.height; y++) for (let x = Math.floor(58 * fixture.unit); x < pixels.width; x++) {
    const i = (y * pixels.width + x) * 4;
    if (isHealthRed(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]))
      pixels.data.set([40, 100, 80, 255], i);
  }
  expect(readBattleNumber(pixels, region, "health")).toBeNull();
});

it.each([[255, 255, 255], [255, 90, 100], [90, 180, 20], [50, 110, 100]])(
  "rejects a solid background without digit shapes (%p)", (r, g, b) => {
    const fixture = fixtures[0], pixels = pixelsFor(fixture);
    for (let i = 0; i < pixels.data.length; i += 4) pixels.data.set([r, g, b, 255], i);
    expect(readBattleNumber(pixels, regionFor(fixture), "health")).toBeNull();
  },
);
