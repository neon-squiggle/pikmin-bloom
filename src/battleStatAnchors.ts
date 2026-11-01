import type { ImageRegion, PixelImage } from "./screenshotImage";

export interface StatAnchor extends ImageRegion {
  unit: number;
}

// Work in width-normalized coordinates. These are icon shapes and spacing,
// independent of the screenshot height, pie fill, number text, and background.
const REFERENCE_WIDTH = 590;
// Green foreground of the strength icon sampled from IMG_3632 at this scale.
// No digit or pie-fill templates are used.
const AP_ICON = `................................................
................................................
................................................
................................................
................................................
................................................
....###..................................###....
....#####..............................#####....
....#######..........................####.##....
....###.###..........................###..##....
....###.####........................####.###....
....####.###........................###.####....
....#####.##........................##.#####....
.....####.##........................##.####.....
......######........................######......
........###..........................###........
..........#............##............#..........
..........##.........######.........##..........
...........#..........####..........#...........
...........#..........####.........##...........
...........###........####........###...........
..........######................######..........
..........#######..............#######..........
.........########..............########.........
.........########..............########.........
.........########..............########.........
..........#######..............#######..........
...........######..#........#..######...........
............####................####............
.............###..#..........#..###.............
..............####............####..............
............######.............#####............
.............#####............#####.#...........
............######............######............
.............#####............#####.............
.............#####............#####.............
.............#####............#####.............
.............##.##............##.##.............
.................#............#.................
..................................#.............
................................................
................................................
................................................
................................................
................................................
................................................
................................................`.split("\n");

export const isHealthRed = (r: number, g: number, b: number) =>
  r > 195 && g < 180 && b < 190 && r > g * 1.3;
export const isApGreen = (r: number, g: number, b: number) =>
  g > 85 && g > r * 1.3 && g > b * 1.5;

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
  const red = new Uint8Array(width * height);
  const green = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.min(image.width - 1, Math.round(x * scale));
    const sy = Math.min(image.height - 1, Math.round((y + top) * scale));
    const i = (sy * image.width + sx) * 4;
    const [r, g, b] = [image.data[i], image.data[i + 1], image.data[i + 2]];
    // A resized one-pixel rim is dimmer than pure white. Accept its
    // antialiased edges here; the ring shape and dark exterior still gate it.
    white[y * width + x] = r > 170 && g > 170 && b > 170 ? 1 : 0;
    red[y * width + x] = isHealthRed(r, g, b) ? 1 : 0;
    green[y * width + x] = isApGreen(r, g, b) ? 1 : 0;
  }
  const redCount = integral(red, width, height);
  const greenCount = integral(green, width, height);
  // Match the rim within one normalized pixel to tolerate resampling. The
  // exterior check below still uses the untouched mask, so a solid white
  // background cannot satisfy the same circular boundary.
  const nearWhite = new Uint8Array(white.length);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    let found = false;
    for (let dy = -1; dy <= 1 && !found; dy++) for (let dx = -1; dx <= 1; dx++)
      if (white[(y + dy) * width + x + dx]) { found = true; break; }
    nearWhite[y * width + x] = found ? 1 : 0;
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
      for (let x = radius + 3; x < width * 0.14; x++) {
        if (!redCount(x - radius, y - radius, radius * 2, radius * 2)) continue;
        let rim = 0, outside = 0;
        for (let i = 0; i < inner.length; i++) {
          rim += nearWhite[(y + inner[i][1]) * width + x + inner[i][0]];
          outside += white[(y + outer[i][1]) * width + x + outer[i][0]];
        }
        const score = (rim + 40 - outside) / 80;
        if (rim >= 34 && outside <= 6 && score > circleScore) {
          circleScore = score;
          health = original({ left: x - radius - 2, top: y - radius - 2,
            width: (radius + 2) * 2, height: (radius + 2) * 2 }, (radius + 2) / 21);
        }
      }
  }

  // Match the green figures themselves, rather than deleting thin strokes
  // from the AP digits. Search several sizes to tolerate UI scaling changes.
  let ap: StatAnchor | null = null;
  let apScore = 0.65;
  for (const factor of [1, 0.9, 1.1]) {
    const w = Math.round(AP_ICON[0].length * factor), h = Math.round(AP_ICON.length * factor);
    const points: number[][] = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (AP_ICON[Math.min(AP_ICON.length - 1, Math.floor(y / factor))]
        [Math.min(AP_ICON[0].length - 1, Math.floor(x / factor))] === "#") points.push([x, y]);
    for (let y = 0; y <= height - h; y++) for (let x = width / 2; x <= width - w; x++) {
      const count = greenCount(x, y, w, h);
      if (Math.min(count, points.length) / Math.max(count, points.length) <= apScore) continue;
      let overlap = 0;
      for (const [dx, dy] of points) overlap += green[(y + dy) * width + x + dx];
      const score = overlap / (count + points.length - overlap);
      if (score > apScore) {
        apScore = score;
        ap = original({ left: x, top: y, width: w, height: h }, factor);
      }
    }
  }
  if (health && ap && Math.abs(health.top + health.height / 2 - ap.top - ap.height / 2) >
    Math.max(health.height, ap.height) * 0.25) return { health: null, ap: null };
  return { health, ap };
};
