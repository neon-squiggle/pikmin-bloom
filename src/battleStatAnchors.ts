import type { ImageRegion, PixelImage } from "./screenshotImage";

export interface StatAnchor extends ImageRegion {
  unit: number;
  inkHue?: number;
}

// Work in width-normalized coordinates. These are icon shapes and spacing,
// independent of the screenshot height, pie fill, number text, and background.
const REFERENCE_WIDTH = 590;
// White outlines of the two figures sampled at this scale. The center star
// and decorations above the figures are excluded when comparing shapes.
const AP_ICON = `................................................
................................................
................................................
................................................
...####..................................####...
..########............................########..
.###....###..........................###....##..
.###......##........................##......##..
.##........##......................##........#..
.##.........##....................##.........#..
.###........##....................##........##..
.###....#...##....................##...#....##..
..##........##....................##........##..
...##....#..##....................##..#....##...
...###......##.........##.........##......###...
....####...##.........#.##.........##....###....
.....#####.##.......###..###.......##.#####.....
........##..##.....##......#......##..##........
.........##.###.....#......#.....###.##.........
.........##..####...##....#....####..##.........
.........##....###...#....#...###....##.........
........##......##...######...##......##........
........#........##......#...##........#........
.......##........##..........##........##.......
.......##........####......####........##.......
.......##........#####....#####........##.......
........##.......##.###..###.##.......##........
........##.......##.###..###.##.......##........
.........###.....#####....#####.....###.........
..........###....#.##......##.#....###..........
..........###.....###......###.....###..........
..........##......##........##......###.........
.........##.......##........##.......##.........
..........##......##........##......##..........
..........##......##........##......#...........
...........##.....##........##.....##...........
...........##.....##........##.....##...........
...........##.....##........##.....##...........
...........##..##.##........##.###.##...........
...........##.##..##........##..##.##...........
...........#########........#########...........
............#######..........#######............
................................................
................................................
................................................
................................................
................................................`.split("\n");

export const isHealthRed = (r: number, g: number, b: number) =>
  r > 195 && g < 180 && b < 190 && r > g * 1.3;

export const isWhiteOutline = (r: number, g: number, b: number) =>
  Math.min(r, g, b) > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 45;

const hueOf = (r: number, g: number, b: number, minimumSaturation = 0.3): number | null => {
  const high = Math.max(r, g, b), low = Math.min(r, g, b), difference = high - low;
  if (high < 85 || difference / high < minimumSaturation) return null;
  const sector = high === r ? (g - b) / difference
    : high === g ? (b - r) / difference + 2 : (r - g) / difference + 4;
  return (sector * 60 + 360) % 360;
};

export const isApInk = (r: number, g: number, b: number, expectedHue: number) => {
  const hue = hueOf(r, g, b, 0.4);
  if (hue == null) return false;
  const difference = Math.abs(hue - expectedHue);
  return Math.min(difference, 360 - difference) <= 20;
};

// Sample the interiors of both matched figures, avoiding stars and outlines.
// Their current fill supplies a hue for the digits; no AP hue is hardcoded.
const sampleApHue = (image: PixelImage, anchor: StatAnchor): number | undefined => {
  const bins: number[][] = Array.from({ length: 36 }, () => []);
  for (const [x, y] of [[6, 10], [8, 13], [13, 24], [15, 27], [14, 33], [16, 36]])
    for (const sx of [x, 47 - x]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const px = Math.round(anchor.left + sx * anchor.unit) + dx;
      const py = Math.round(anchor.top + y * anchor.unit) + dy;
      if (px < 0 || py < 0 || px >= image.width || py >= image.height) continue;
      const i = (py * image.width + px) * 4;
      const hue = hueOf(image.data[i], image.data[i + 1], image.data[i + 2]);
      if (hue != null) bins[Math.floor(hue / 10)].push(hue);
    }
  const best = bins.reduce((a, b) => a.length >= b.length ? a : b);
  return best.length ? best.reduce((sum, hue) => sum + hue, 0) / best.length : undefined;
};

const integral = (mask: Uint8Array, width: number, height: number) => {
  const sums = new Uint32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++)
    sums[(y + 1) * (width + 1) + x + 1] = mask[y * width + x] +
      sums[y * (width + 1) + x + 1] + sums[(y + 1) * (width + 1) + x] -
      sums[y * (width + 1) + x];
  return (left: number, top: number, w: number, h: number) =>
    sums[(top + h) * (width + 1) + left + w] - sums[top * (width + 1) + left + w] -
    sums[(top + h) * (width + 1) + left] + sums[top * (width + 1) + left];
};

// Tolerance for subpixel outline placement; this never touches digit pixels.
const dilate = (mask: Uint8Array, width: number, height: number) => {
  const expanded = new Uint8Array(mask.length);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    let found = false;
    for (let dy = -1; dy <= 1 && !found; dy++) for (let dx = -1; dx <= 1; dx++)
      if (mask[(y + dy) * width + x + dx]) { found = true; break; }
    expanded[y * width + x] = found ? 1 : 0;
  }
  return expanded;
};

export const findBattleStatAnchors = (image: PixelImage, stats: ImageRegion): {
  health: StatAnchor | null;
  ap: StatAnchor | null;
} => {
  const scale = image.width / REFERENCE_WIDTH;
  const width = REFERENCE_WIDTH;
  const top = Math.max(0, Math.floor(stats.top / scale));
  const bottom = Math.min(Math.floor(image.height / scale),
    Math.ceil((stats.top + stats.height) / scale));
  const height = bottom - top;
  const white = new Uint8Array(width * height);
  const brightWhite = new Uint8Array(width * height);
  const light = new Uint8Array(width * height);
  const red = new Uint8Array(width * height);
  const outline = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.min(image.width - 1, Math.round(x * scale));
    const sy = Math.min(image.height - 1, Math.round((y + top) * scale));
    const i = (sy * image.width + sx) * 4;
    const [r, g, b] = [image.data[i], image.data[i + 1], image.data[i + 2]];
    // A resized one-pixel rim is dimmer than pure white. Accept its
    // antialiased edges here; the ring shape and dark exterior still gate it.
    white[y * width + x] = r > 170 && g > 170 && b > 170 ? 1 : 0;
    brightWhite[y * width + x] = Math.min(r, g, b) > 235 ? 1 : 0;
    light[y * width + x] = Math.min(r, g, b);
    red[y * width + x] = isHealthRed(r, g, b) ? 1 : 0;
    outline[y * width + x] = isWhiteOutline(r, g, b) ? 1 : 0;
  }
  const redCount = integral(red, width, height);
  const outlineCount = integral(outline, width, height);
  // Match the rim within one normalized pixel to tolerate resampling. The
  // exterior check below still uses the untouched mask, so a solid white
  // background cannot satisfy the same circular boundary.
  const nearWhite = dilate(white, width, height);
  const nearOutline = dilate(outline, width, height);
  const nearLight = new Uint8Array(light.length);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    let brightest = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
      brightest = Math.max(brightest, light[(y + dy) * width + x + dx]);
    nearLight[y * width + x] = brightest;
  }
  const original = (region: ImageRegion, unit: number): StatAnchor => ({
    left: region.left * scale, top: (region.top + top) * scale,
    width: region.width * scale, height: region.height * scale, unit: unit * scale,
  });

  // Match a white circular rim with a dark exterior. Its interior is ignored
  // except for requiring some red, so any nonzero pie fill is supported.
  let health: StatAnchor | null = null;
  let circleScore = 0.86;
  for (let radius = 17; radius <= 23; radius++) {
    const inner: number[][] = [], outer: number[][] = [];
    for (let i = 0; i < 40; i++) {
      const angle = i * Math.PI / 20;
      inner.push([Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)]);
      outer.push([Math.round(Math.cos(angle) * (radius + 2)), Math.round(Math.sin(angle) * (radius + 2))]);
    }
    for (let y = radius + 3; y < height - radius - 3; y++)
      // The complete icon must fit in the left icon column. Otherwise a
      // rounded white outline on the first HP digit could resemble the rim.
      for (let x = radius + 3; x + radius + 2 < width * 0.12; x++) {
        if (!redCount(x - radius, y - radius, radius * 2, radius * 2)) continue;
        let rim = 0, strongRim = 0, outside = 0, contrast = 0;
        for (let i = 0; i < inner.length; i++) {
          rim += nearWhite[(y + inner[i][1]) * width + x + inner[i][0]];
          if (nearLight[(y + inner[i][1]) * width + x + inner[i][0]] > 235) strongRim++;
          outside += brightWhite[(y + outer[i][1]) * width + x + outer[i][0]];
          contrast += nearLight[(y + inner[i][1]) * width + x + inner[i][0]] -
            light[(y + outer[i][1]) * width + x + outer[i][0]];
        }
        const score = (rim + 40 - outside) / 80;
        if (rim >= 34 && strongRim >= 24 && outside <= 6 && contrast / 40 >= 25 && score > circleScore) {
          circleScore = score;
          health = original({ left: x - radius - 2, top: y - radius - 2,
            width: (radius + 2) * 2, height: (radius + 2) * 2 }, (radius + 2) / 21);
        }
      }
  }

  // Compare the white figure contours, independently of the fill hue.
  // Ignore the central star and upper decorations, which vary with strength.
  let ap: StatAnchor | null = null;
  let apScore = 0.75;
  for (const factor of [1, 0.9, 1.1]) {
    const w = Math.round(AP_ICON[0].length * factor), h = Math.round(AP_ICON.length * factor);
    const template = new Uint8Array(w * h), tested = new Uint8Array(w * h);
    const points: number[][] = [];
    const panels = [[0, 19], [29, 48]].map(([left, right]) => ({
      left: Math.floor(left * factor), top: Math.ceil(4 * factor),
      width: Math.min(w, Math.round(right * factor)) - Math.floor(left * factor),
      height: Math.floor(43 * factor) - Math.ceil(4 * factor),
    }));
    for (const panel of panels) for (let y = panel.top; y < panel.top + panel.height; y++)
      for (let x = panel.left; x < panel.left + panel.width; x++) {
        tested[y * w + x] = 1;
        if (AP_ICON[Math.min(AP_ICON.length - 1, Math.floor(y / factor))]
          [Math.min(AP_ICON[0].length - 1, Math.floor(x / factor))] === "#") {
          template[y * w + x] = 1;
          points.push([x, y]);
        }
      }
    const expanded = dilate(template, w, h), nearby: number[][] = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (tested[y * w + x] && expanded[y * w + x]) nearby.push([x, y]);
    const center = health ? (health.top + health.height / 2) / scale - top : null;
    const firstY = center == null ? 0 : Math.max(0, Math.floor(center - h * 0.75));
    const lastY = center == null ? height - h : Math.min(height - h, Math.ceil(center - h * 0.25));
    for (let y = firstY; y <= lastY; y++) for (let x = width / 2; x <= width - w; x++) {
      let count = 0;
      for (const panel of panels) count += outlineCount(
        x + panel.left, y + panel.top, panel.width, panel.height);
      if (count < points.length * 0.35 || count > points.length * 4) continue;
      let covered = 0;
      for (const [dx, dy] of points) covered += nearOutline[(y + dy) * width + x + dx];
      const recall = covered / points.length;
      if (recall < 0.85) continue;
      let consistent = 0;
      for (const [dx, dy] of nearby) consistent += outline[(y + dy) * width + x + dx];
      const precision = consistent / count;
      if (precision < 0.6) continue;
      const score = 2 * recall * precision / (recall + precision);
      if (score > apScore) {
        apScore = score;
        ap = original({ left: x, top: y, width: w, height: h }, factor);
      }
    }
  }
  if (health && ap && Math.abs(health.top + health.height / 2 - ap.top - ap.height / 2) >
    Math.max(health.height, ap.height) * 0.25) return { health: null, ap: null };
  if (ap) ap.inkHue = sampleApHue(image, ap);
  return { health, ap };
};
