import font from "./battleNumberFont.json";
import { isApInk, isHealthRed, isWhiteOutline } from "./battleStatAnchors";
import { parseStatNumber } from "./screenshotParsing";
import type { ImageRegion, PixelImage } from "./screenshotImage";

type NumberField = "health" | "ap";
type NumberRegion = ImageRegion & { inkHue?: number; unit?: number };
export interface BattleNumberReading {
  text: string;
  value: number;
  score: number;
}

// Agreement with a font shape, not a probability of correctness. These
// thresholds apply equally to all digits, values, colors, and screenshots.
const MIN_GLYPH_SCORE = 0.83;
const MIN_MARGIN = 0.035;
// Less evidence is needed to suspect an occupied cell than to identify its
// digit. An unclear outline must block a shorter match, not be discarded.
const MIN_CELL_EVIDENCE = 0.7;
let digitHeight = 0;
const glyphs = Object.entries(font.glyphs).map(([text, bitmap]) => {
  const rows = bitmap.split("\n");
  const points: { x: number; y: number; ink: boolean }[] = [];
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    const ink = rows[y][x] === "#";
    if (ink && text !== ",") digitHeight = Math.max(digitHeight, y + 1);
    // Only the glyph's immediate white contour is meaningful. Background
    // inside holes or outside a digit can have the same hue as its fill.
    const contour = rows[y][x] === "o" && rows.some((row, yy) =>
      Math.abs(yy - y) <= font.contourRadius && Array.from(row).some((pixel, xx) =>
        pixel === "#" && Math.abs(xx - x) <= font.contourRadius));
    if (ink || contour) points.push({ x, y, ink });
  }
  return { text, points, advance: text === "," ? font.commaAdvance : font.digitAdvance };
});

// Match complete character cells against the unmodified screenshot. Nothing
// flood-fills, erodes, repairs, or removes digit pixels before recognition.
export const readBattleNumber = (
  image: PixelImage,
  region: NumberRegion | undefined,
  field: NumberField,
): BattleNumberReading | null => {
  if (!region || region.width <= 0 || region.height <= 0 ||
      (field === "ap" && region.inkHue == null)) return null;
  const unit = region.unit ?? image.width / font.referenceWidth;
  if (!Number.isFinite(unit) || unit <= 0) return null;
  const width = Math.ceil(region.width / unit), height = Math.ceil(region.height / unit);
  if (width < font.digitAdvance || height < font.height) return null;
  const ink = new Uint8Array(width * height), white = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.floor(region.left + x * unit), sy = Math.floor(region.top + y * unit);
    if (sx < 0 || sy < 0 || sx >= image.width || sy >= image.height) continue;
    const i = (sy * image.width + sx) * 4;
    const r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
    ink[y * width + x] = (field === "health" ? isHealthRed(r, g, b)
      : isApInk(r, g, b, region.inkHue!)) ? 1 : 0;
    white[y * width + x] = isWhiteOutline(r, g, b) ? 1 : 0;
  }
  const cache = new Map<number, Float64Array>();
  const scoreAt = (x: number, y: number) => {
    const key = Math.round(x * 4) * (height + 4) + y + 1;
    const previous = cache.get(key);
    if (previous) return previous;
    const values = new Float64Array(glyphs.length * 2);
    glyphs.forEach((glyph, index) => {
      let matched = 0, edges = 0;
      for (const point of glyph.points) {
        const xx = Math.round(x + point.x), yy = Math.round(y + point.y);
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const p = yy * width + xx;
        matched += point.ink ? ink[p] : white[p];
        // An outline with unreadable fill still signals an occupied cell:
        // it must not be mistaken for the end of a shorter HP number.
        edges += point.ink ? 1 - white[p] : white[p];
      }
      values[index * 2] = matched / glyph.points.length;
      values[index * 2 + 1] = edges / glyph.points.length;
    });
    cache.set(key, values);
    return values;
  };
  const scores = (x: number, y: number) => {
    // Share comparisons across neighboring alignments and candidate strings.
    const positions: Float64Array[] = [];
    for (const ox of [-1, 0, 1]) for (const oy of [-1, 0, 1])
      positions.push(scoreAt(x + ox, y + oy));
    return glyphs.map((glyph, index) => {
      let score = 0, edgeScore = 0;
      for (const values of positions) {
        score = Math.max(score, values[index * 2]);
        edgeScore = Math.max(edgeScore, values[index * 2 + 1]);
      }
      return { text: glyph.text, score, edgeScore, advance: glyph.advance };
    }).sort((a, b) => b.score - a.score);
  };

  const candidates = new Map<string, BattleNumberReading & { sum: number }>();
  // The icon anchors the first cell. This range is less than one character
  // advance, so searching cannot skip a leading digit to improve the score.
  for (let y = 0; y <= height - font.height; y++) for (let x = 0; x <= font.firstCellSearch; x++) {
    let cursor = x, text = "", sum = 0;
    while (cursor + font.commaAdvance < width) {
      const [best, runnerUp] = scores(cursor, y);
      if (best.score < MIN_GLYPH_SCORE || best.score - runnerUp.score < MIN_MARGIN) break;
      if (!text && best.text === ",") break;
      text += best.text;
      sum += best.score;
      cursor += best.advance;
    }
    const value = parseStatNumber(text);
    if (value == null) continue;
    if (field === "ap") {
      // AP is right aligned: an unreadable trailing digit cannot disappear
      // into a successful shorter match that stops before the right margin.
      const gap = width - cursor;
      if (gap < font.apRightPadding.min || gap > font.apRightPadding.max) continue;
    } else {
      let remainingInk = false;
      for (let yy = y; yy < Math.min(height, y + digitHeight + 1); yy++)
        for (let xx = Math.ceil(cursor); xx < width; xx++)
          if (ink[yy * width + xx]) remainingInk = true;
      if (remainingInk || scores(cursor, y).some((glyph) => glyph.edgeScore >= MIN_CELL_EVIDENCE)) continue;
    }
    const previous = candidates.get(text);
    if (!previous || sum / text.length > previous.score)
      candidates.set(text, { text, value, sum, score: sum / text.length });
  }
  const ranked = Array.from(candidates.values()).sort((a, b) => b.score - a.score);
  const [best, runnerUp] = ranked;
  if (!best || (runnerUp && best.sum - runnerUp.sum < MIN_MARGIN)) return null;
  return { text: best.text, value: best.value, score: best.score };
};
