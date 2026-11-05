import { findBattleStatAnchors } from "./battleStatAnchors";

export interface PixelImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface ImageRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

const isWhite = (r: number, g: number, b: number) =>
  r > 225 && g > 225 && b > 225;

// Find the broad white bottom sheet, then the colored stats just above it.
// All search windows scale with the image; no phone-specific pixel coordinates.
export const findStatsRegion = ({
  data,
  width,
  height,
}: PixelImage): ImageRegion => {
  let sheetTop = 0;
  let consecutive = 0;
  for (let y = Math.floor(height * 0.28); y < height * 0.85; y++) {
    let white = 0;
    let total = 0;
    for (let x = Math.floor(width * 0.15); x < width * 0.85; x += 4) {
      const i = (y * width + x) * 4;
      if (isWhite(data[i], data[i + 1], data[i + 2])) white++;
      total++;
    }
    consecutive = white / total > 0.96 ? consecutive + 1 : 0;
    if (consecutive >= Math.max(8, Math.round(height * 0.005))) {
      sheetTop = y - consecutive + 1;
      break;
    }
  }
  if (!sheetTop)
    throw new Error(
      "Couldn't locate the battle stats. Use a full screenshot with the countdown and white details panel visible.",
    );
  return {
    left: 0,
    top: Math.max(0, Math.floor(sheetTop - height * 0.1)),
    width,
    height: Math.ceil(height * 0.1),
  };
};

export type BattleField = "health" | "ap" | "countdown";
export type BattleFieldRegions = Partial<Record<BattleField, ImageRegion & { inkHue?: number }>>;

// Icon dimensions provide the font scale and spacing. Screenshot height is
// deliberately absent from these offsets: adding space below the battle must
// not move or truncate any numeric field.
export const locateBattleFields = (image: PixelImage, stats: ImageRegion): BattleFieldRegions => {
  const { health, ap } = findBattleStatAnchors(image, stats);
  const fields: BattleFieldRegions = {};
  if (health) {
    const left = health.left + health.width + health.unit;
    const right = ap ? ap.left - 4 * ap.unit : image.width * 0.75;
    fields.health = { left, top: health.top - 2 * health.unit,
      width: right - left, height: health.height + 6 * health.unit };
  }
  if (ap) {
    const left = ap.left + ap.width + ap.unit;
    fields.ap = { left, top: ap.top - 2 * ap.unit,
      width: image.width * 0.99 - left, height: ap.height + 6 * ap.unit, inkHue: ap.inkHue };
  }
  const anchor = health ?? ap;
  if (anchor) {
    const left = health?.left ?? image.width * 0.025;
    const right = Math.min(image.width * 0.7, ap ? ap.left - 4 * ap.unit : image.width);
    const top = anchor.top + anchor.height + 2 * anchor.unit;
    const bottom = Math.min(top + 28 * anchor.unit, stats.top + stats.height - 3 * anchor.unit);
    fields.countdown = { left, top, width: right - left, height: bottom - top };
  }
  return fields;
};

export const cropBattleCountdown = (
  image: PixelImage,
  stats: ImageRegion,
  regions = locateBattleFields(image, stats),
): PixelImage => {
  const region = regions.countdown;
  if (!region || region.width <= 0 || region.height <= 0)
    throw new Error("Couldn't locate countdown in the screenshot.");
  return maskCountdownLine(cropRegion(image, region));
};

const maskCountdownLine = (crop: PixelImage): PixelImage => {
  // The font is always white. Locate its dominant uninterrupted text row;
  // a detached health-comma fragment must not affect OCR word segmentation.
  let start = 0, ink = 0, bestInk = 0, top = 0, bottom = 0;
  for (let y = 0; y <= crop.height; y++) {
    let count = 0;
    if (y < crop.height) for (let x = 0; x < crop.width; x++) {
      const i = (y * crop.width + x) * 4;
      if (Math.min(crop.data[i], crop.data[i + 1], crop.data[i + 2]) > 200) count++;
    }
    if (count) {
      if (!ink) start = y;
      ink += count;
    } else {
      if (ink > bestInk) { bestInk = ink; top = start; bottom = y; }
      ink = 0;
    }
  }
  if (!bestInk) throw new Error("Couldn't locate countdown in the screenshot.");
  let left = crop.width, right = -1;
  for (let y = top; y < bottom; y++) for (let x = 0; x < crop.width; x++) {
    const i = (y * crop.width + x) * 4;
    if (Math.min(crop.data[i], crop.data[i + 1], crop.data[i + 2]) > 200) {
      left = Math.min(left, x); right = Math.max(right, x);
    }
  }
  left = Math.max(0, left - 1); right = Math.min(crop.width - 1, right + 1);
  top = Math.max(0, top - 1); bottom = Math.min(crop.height, bottom + 1);
  const width = right - left + 25, height = bottom - top + 24;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = top; y < bottom; y++) for (let x = left; x <= right; x++) {
    const i = (y * crop.width + x) * 4;
    // Preserve soft edges as gray, with the known white fill rendered black.
    const light = Math.min(crop.data[i], crop.data[i + 1], crop.data[i + 2]);
    const gray = 255 - Math.max(0, Math.min(255, (light - 170) * 3));
    const out = ((y - top + 12) * width + x - left + 12) * 4;
    data[out] = data[out + 1] = data[out + 2] = gray;
  }
  return { width, height, data };
};

const cropRegion = (image: PixelImage, region: ImageRegion): PixelImage => {
  const left = Math.max(0, Math.floor(region.left));
  const top = Math.max(0, Math.floor(region.top));
  const right = Math.min(image.width, Math.ceil(region.left + region.width));
  const bottom = Math.min(image.height, Math.ceil(region.top + region.height));
  const width = right - left;
  const height = bottom - top;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const start = ((top + y) * image.width + left) * 4;
    data.set(image.data.subarray(start, start + width * 4), y * width * 4);
  }
  return { width, height, data };
};

// Mushroom text begins below the sheet edge and can wrap for event types.
export const cropMushroomTypeField = (
  image: PixelImage,
  stats: ImageRegion,
): PixelImage => {
  const sheetTop = stats.top + stats.height;
  const top = sheetTop + Math.floor(image.height * 0.025);
  const bottom = Math.min(
    image.height,
    sheetTop + Math.floor(image.height * 0.13),
  );
  const left = Math.floor(image.width * 0.04);
  return cropRegion(image, {
    left,
    top,
    width: Math.ceil(image.width * 0.96) - left,
    height: bottom - top,
  });
};

// A single measured UI layout, in units where the screenshot is 590 wide.
// Bubble width follows the title; height and internal padding remain fixed.
const TITLE_LAYOUT = {
  width: 590,
  bubbleHeight: 70,
  arrowWidth: 10,
  arrowHeight: 17,
  arrowTop: 26,
  arrowRight: 31,
  labelLeft: 24,
  labelRight: 49,
  labelTop: 18,
  labelBottom: 14,
};

// Navigation chevron template, including its surrounding dark pixels.
const TITLE_ARROW = `.#........
###.......
.###......
..###.....
...###....
....###...
.....###..
......###.
.......###
......####
.....####.
....####..
...####...
..####....
.####.....
####......
.##.......`
  .split("\n")
  .flatMap((row, y) =>
    Array.from(row).flatMap((pixel, x) => pixel === "#" ? [[x, y]] : []),
  );

export const cropTitleField = (image: PixelImage): PixelImage => {
  const layout = TITLE_LAYOUT;
  const scale = image.width / layout.width;
  const width = layout.width;
  // Search the upper quarter, allowing different status-bar and screen heights.
  const height = Math.ceil(image.height / scale / 4);
  const white = new Uint8Array(width * height);
  const sums = new Uint32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx = Math.min(image.width - 1, Math.round(x * scale));
      const sy = Math.min(image.height - 1, Math.round(y * scale));
      const index = (sy * image.width + sx) * 4;
      white[y * width + x] = isWhite(
        image.data[index], image.data[index + 1], image.data[index + 2],
      ) ? 1 : 0;
      sums[(y + 1) * (width + 1) + x + 1] =
        white[y * width + x] + sums[y * (width + 1) + x + 1] +
        sums[(y + 1) * (width + 1) + x] - sums[y * (width + 1) + x];
    }
  let best = { score: 0.7, left: 0, top: 0 };
  for (let y = 0; y <= height - layout.arrowHeight; y++)
    for (let x = width / 2; x <= width - layout.arrowWidth; x++) {
      const right = x + layout.arrowWidth, bottom = y + layout.arrowHeight;
      const count = sums[bottom * (width + 1) + right] -
        sums[y * (width + 1) + right] - sums[bottom * (width + 1) + x] +
        sums[y * (width + 1) + x];
      // Skip candidates whose best possible intersection-over-union is too low.
      if (Math.min(count, TITLE_ARROW.length) / Math.max(count, TITLE_ARROW.length) <= best.score)
        continue;
      let overlap = 0;
      for (const [dx, dy] of TITLE_ARROW)
        overlap += white[(y + dy) * width + x + dx];
      const score = overlap / (count + TITLE_ARROW.length - overlap);
      if (score > best.score) best = { score, left: x, top: y };
    }
  if (!best.left) throw new Error("Couldn't locate the title arrow.");
  const bubbleRight = best.left + layout.arrowWidth + layout.arrowRight;
  const bubbleLeft = width - bubbleRight;
  const bubbleTop = best.top - layout.arrowTop;
  const left = bubbleLeft + layout.labelLeft;
  const top = bubbleTop + layout.labelTop;
  const right = bubbleRight - layout.labelRight;
  const bottom = bubbleTop + layout.bubbleHeight - layout.labelBottom;
  if (left < 0 || top < 0 || right <= left || bottom * scale > image.height)
    throw new Error("Couldn't locate the title text area.");
  return cropRegion(image, {
    left: left * scale,
    top: top * scale,
    width: (right - left) * scale,
    height: (bottom - top) * scale,
  });
};
