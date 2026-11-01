import { createHash } from "crypto";
import { inflateSync } from "zlib";
import fixture from "./testFixtures/battleStatPixels.json";
import { findStatsRegion, maskBattleField, PixelImage } from "./screenshotImage";
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

it.each(["health", "ap", "countdown"] as const)(
  "keeps the %s crop unchanged when screenshot height changes below the battle",
  (field) => {
    const original = scene(), taller = scene(800);
    expect(fingerprint(maskBattleField(taller, findStatsRegion(taller), field)))
      .toEqual(fingerprint(maskBattleField(original, findStatsRegion(original), field)));
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
  expect(fingerprint(maskBattleField(changed, findStatsRegion(changed), "health")))
    .toEqual(fingerprint(maskBattleField(original, findStatsRegion(original), "health")));
});

it("locates the circle rim and green figures in original screenshot pixels", () => {
  const pixels = scene();
  const anchors = findBattleStatAnchors(pixels, findStatsRegion(pixels));
  expect(anchors.health).not.toBeNull();
  expect(anchors.ap).not.toBeNull();
  expect(anchors.health!.left).toBeGreaterThan(20);
  expect(anchors.health!.left + anchors.health!.width).toBeLessThan(125);
  expect(anchors.ap!.left).toBeGreaterThan(860);
  expect(anchors.ap!.left + anchors.ap!.width).toBeLessThan(980);
});

const paint = (pixels: PixelImage, left: number, top: number, w: number, h: number, rgb: number[]) => {
  for (let y = top; y < top + h; y++) for (let x = left; x < left + w; x++)
    pixels.data.set([...rgb, 255], (y * pixels.width + x) * 4);
};

it("keeps thin AP digits and commas regardless of their component size", () => {
  const pixels = scene();
  paint(pixels, 970, 1038, 188, 106, [50, 110, 100]);
  paint(pixels, 1000, 1060, 3, 70, [90, 180, 20]);
  paint(pixels, 1050, 1060, 20, 70, [90, 180, 20]);
  paint(pixels, 1020, 1130, 3, 8, [90, 180, 20]);
  const crop = maskBattleField(pixels, findStatsRegion(pixels), "ap");
  let ink = 0;
  for (let i = 0; i < crop.data.length; i += 4) if (crop.data[i] === 0) ink++;
  expect(ink).toBe((3 + 20) * 70 + 3 * 8);
});

it.each(["health", "ap"] as const)("requires the %s icon instead of guessing a number crop", (field) => {
  const pixels = scene();
  if (field === "health") paint(pixels, 24, 1038, 100, 106, [255, 90, 100]);
  else paint(pixels, 866, 1038, 108, 106, [50, 110, 100]);
  expect(() => maskBattleField(pixels, findStatsRegion(pixels), field)).toThrow(/Couldn't locate/);
});

it.each(["health", "ap"] as const)("excludes similarly colored artwork above the %s row", (field) => {
  const original = scene(), changed = scene();
  paint(changed, 300, 990, 40, 30, [255, 90, 100]);
  paint(changed, 1000, 990, 40, 30, [90, 180, 20]);
  expect(fingerprint(maskBattleField(changed, findStatsRegion(changed), field)))
    .toEqual(fingerprint(maskBattleField(original, findStatsRegion(original), field)));
});

it("excludes health-comma outlines immediately above the countdown text", () => {
  const original = scene(), changed = scene();
  // IMG_4105 exposed a health-comma outline leaking into the top of the timer
  // crop. The same relative position in this fixture must be outside the crop.
  paint(changed, 230, 1137, 12, 3, [255, 255, 255]);
  expect(fingerprint(maskBattleField(changed, findStatsRegion(changed), "countdown")))
    .toEqual(fingerprint(maskBattleField(original, findStatsRegion(original), "countdown")));
});

it.each(["health", "ap"] as const)("follows the icons when the %s row moves vertically", (field) => {
  const original = scene(), shifted = scene(0, 150);
  expect(fingerprint(maskBattleField(shifted, findStatsRegion(shifted), field)))
    .toEqual(fingerprint(maskBattleField(original, findStatsRegion(original), field)));
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
    const crop = maskBattleField(pixels, findStatsRegion(pixels), field);
    const reference = maskBattleField(original, findStatsRegion(original), field);
    expect(crop.width - 24).toBeCloseTo((reference.width - 24) * factor, -1);
  }
});
