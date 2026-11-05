import { createHash } from "crypto";
import { inflateSync } from "zlib";
import fixture from "./testFixtures/battleStatPixels.json";
import apBackground from "./testFixtures/apBackgroundPixels.json";
import { findStatsRegion, cropBattleCountdown, locateBattleFields, PixelImage } from "./screenshotImage";
import { readBattleNumber } from "./readBattleNumber";
import { findBattleStatAnchors } from "./battleStatAnchors";

const scene = (bottomPadding = 0, verticalShift = 0): PixelImage => {
  const width = fixture.width, height = fixture.height + bottomPadding + verticalShift;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set([50, 110, 100, 255], i);
  data.fill(255, (fixture.sheetTop + verticalShift) * width * 4);
  for (const patch of fixture.patches) {
    const pixels = inflateSync(Buffer.from(patch.data, "base64"));
    for (let y = 0; y < patch.height; y++)
      data.set(pixels.subarray(y * patch.width * 4, (y + 1) * patch.width * 4),
        ((patch.top + verticalShift + y) * width + patch.left) * 4);
  }
  return { width, height, data };
};
const fingerprint = (pixels: PixelImage) => ({
  width: pixels.width, height: pixels.height,
  hash: createHash("sha256").update(pixels.data).digest("hex"),
});

const reading = (pixels: PixelImage, field: "health" | "ap" | "countdown") => {
  const stats = findStatsRegion(pixels), regions = locateBattleFields(pixels, stats);
  return field === "countdown" ? fingerprint(cropBattleCountdown(pixels, stats, regions))
    : readBattleNumber(pixels, regions[field], field)?.value ?? null;
};

it("excludes matching green scenery outside the AP digits' white outlines", () => {
  const pixels = { width: apBackground.width, height: apBackground.height,
    data: new Uint8ClampedArray(inflateSync(Buffer.from(apBackground.data, "base64"))) };
  const region = { left: 0, top: 0, width: pixels.width, height: pixels.height,
    inkHue: apBackground.inkHue };
  expect(readBattleNumber(pixels, { ...region, unit: 1179 / 590 }, "ap")?.value).toBe(1821);
});

it("reads a broken AP outline without losing the intact final digit", () => {
  const pixels = { width: apBackground.width, height: apBackground.height,
    data: new Uint8ClampedArray(inflateSync(Buffer.from(apBackground.data, "base64"))) };
  // Open only the white border beside the final 1 in 1821. All colored
  // digit pixels remain unchanged. This used to let flood fill erase it.
  for (let y = 44; y <= 46; y++) for (let x = 200; x < 220; x++) {
    const i = (y * pixels.width + x) * 4;
    if (Math.min(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]) > 200)
      pixels.data.set([40, 100, 80, 255], i);
  }
  const region = { left: 0, top: 0, width: pixels.width, height: pixels.height,
    inkHue: apBackground.inkHue };
  expect(readBattleNumber(pixels, { ...region, unit: 1179 / 590 }, "ap")?.value).toBe(1821);
});

it.each(["health", "ap", "countdown"] as const)(
  "keeps the %s reading unchanged when screenshot height changes below the battle",
  (field) => {
    const original = scene(), taller = scene(800);
    expect(reading(taller, field))
      .toEqual(reading(original, field));
  },
);

it.each([0.02, 0.25, 0.5, 0.95])("ignores the health pie interior with %p red fill", (fraction) => {
  const original = scene(), changed = scene();
  for (let y = 1055; y < 1127; y++) for (let x = 37; x < 109; x++) {
    const dx = x - 73, dy = y - 1091;
    if (dx * dx + dy * dy >= 36 * 36) continue;
    const angle = (Math.atan2(dy, dx) + Math.PI * 2.5) % (Math.PI * 2);
    changed.data.set(angle < fraction * Math.PI * 2 ? [255, 90, 100, 255] : [255, 255, 255, 255],
      (y * changed.width + x) * 4);
  }
  expect(reading(changed, "health"))
    .toEqual(reading(original, "health"));
});

it("locates the circle rim and strength figures in original screenshot pixels", () => {
  const pixels = scene();
  const anchors = findBattleStatAnchors(pixels, findStatsRegion(pixels));
  expect(anchors.health).not.toBeNull();
  expect(anchors.ap).not.toBeNull();
  expect(anchors.health!.left).toBeGreaterThan(20);
  expect(anchors.health!.left + anchors.health!.width).toBeLessThan(125);
  expect(anchors.ap!.left).toBeGreaterThan(860);
  expect(anchors.ap!.left + anchors.ap!.width).toBeLessThan(980);
});

it.each([[255, 125, 66], [255, 215, 50], [40, 130, 240], [190, 60, 220]])(
  "locates the AP figures after their fill changes to RGB %p,%p,%p", (r, g, b) => {
    const pixels = scene();
    for (let y = 1038; y < 1144; y++) for (let x = 866; x < 1158; x++) {
      const i = (y * pixels.width + x) * 4;
      const [red, green, blue] = [pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]];
      if (green > 85 && green > red * 1.3 && green > blue * 1.5)
        pixels.data.set([r, g, b, 255], i);
    }
    const ap = findBattleStatAnchors(pixels, findStatsRegion(pixels)).ap;
    expect(ap).not.toBeNull();
    expect(ap!.left).toBeGreaterThan(860);
    expect(ap!.left + ap!.width).toBeLessThan(980);
    expect(ap!.inkHue).toBeDefined();
    expect(reading(pixels, "ap")).toBe(654);
  },
);

const paint = (pixels: PixelImage, left: number, top: number, w: number, h: number, rgb: number[]) => {
  for (let y = top; y < top + h; y++) for (let x = left; x < left + w; x++)
    pixels.data.set([...rgb, 255], (y * pixels.width + x) * 4);
};

it("ignores changing stars between and above the AP figures", () => {
  const original = scene(), changed = scene();
  paint(changed, 915, 1030, 12, 90, [255, 255, 255]);
  expect(reading(changed, "ap"))
    .toEqual(reading(original, "ap"));
});

it("does not mistake a red patch on a bright flat background for the health rim", () => {
  const pixels = scene();
  paint(pixels, 24, 1038, 100, 106, [205, 205, 205]);
  paint(pixels, 60, 1080, 10, 20, [255, 90, 100]);
  expect(findBattleStatAnchors(pixels, findStatsRegion(pixels)).health).toBeNull();
});

it.each(["health", "ap"] as const)("requires the %s icon instead of guessing a number crop", (field) => {
  const pixels = scene();
  if (field === "health") paint(pixels, 24, 1038, 100, 106, [255, 90, 100]);
  else paint(pixels, 866, 1038, 108, 106, [50, 110, 100]);
  expect(reading(pixels, field)).toBeNull();
});

it.each(["health", "ap"] as const)("excludes similarly colored artwork above the %s row", (field) => {
  const original = scene(), changed = scene();
  paint(changed, 300, 990, 40, 30, [255, 90, 100]);
  paint(changed, 1000, 990, 40, 30, [90, 180, 20]);
  expect(reading(changed, field))
    .toEqual(reading(original, field));
});

it("excludes health-comma outlines immediately above the countdown text", () => {
  const original = scene(), changed = scene();
  // IMG_4105 exposed a health-comma outline leaking into the top of the timer
  // crop. The same relative position in this fixture must be outside the crop.
  paint(changed, 230, 1137, 12, 3, [255, 255, 255]);
  expect(reading(changed, "countdown"))
    .toEqual(reading(original, "countdown"));
});

it.each(["health", "ap"] as const)("follows the icons when the %s row moves vertically", (field) => {
  const original = scene(), shifted = scene(0, 150);
  expect(reading(shifted, field))
    .toEqual(reading(original, field));
});

it.each([590, 1000, 1600])("locates both icons at %p pixels wide", (width) => {
  const original = scene(), factor = width / original.width;
  const height = Math.round(original.height * factor);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (Math.min(original.height - 1, Math.round(y / factor)) * original.width +
      Math.min(original.width - 1, Math.round(x / factor))) * 4;
    data.set(original.data.subarray(i, i + 4), (y * width + x) * 4);
  }
  const pixels = { width, height, data };
  const anchors = findBattleStatAnchors(pixels, findStatsRegion(pixels));
  expect(anchors.health).not.toBeNull();
  expect(anchors.ap).not.toBeNull();
  for (const field of ["health", "ap"] as const) {
    expect(reading(pixels, field)).toBe(field === "health" ? 2782742 : 654);
  }
});
