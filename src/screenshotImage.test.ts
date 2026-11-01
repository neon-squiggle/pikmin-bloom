import {
  findStatsRegion,
  maskBattleField,
  cropTitleField,
  PixelImage,
} from "./screenshotImage";

const image = (width: number, height: number): PixelImage => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * 4),
});
const fill = (
  pixels: PixelImage,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number[],
) => {
  for (let dy = y; dy < y + h; dy++) {
    for (let dx = x; dx < x + w; dx++) {
      const i = (dy * pixels.width + dx) * 4;
      pixels.data.set([...color, 255], i);
    }
  }
};

it.each([
  [300, 650, 320],
  [600, 1200, 700],
  [400, 1000, 650],
])(
  "locates the sheet on a %p × %p screenshot with the panel at %p",
  (width, height, sheetTop) => {
    const pixels = image(width, height);
    fill(pixels, 0, sheetTop, width, height - sheetTop, [255, 255, 255]);
    fill(
      pixels,
      Math.round(width * 0.4),
      sheetTop + 14,
      Math.round(width * 0.2),
      4,
      [160, 160, 160],
    );
    const stats = findStatsRegion(pixels);
    expect(Math.abs(stats.top + stats.height - sheetTop)).toBeLessThanOrEqual(
      1,
    );
  },
);

it("preserves AP strokes inside the located number crop", () => {
  const pixels = image(600, 1200);
  fill(pixels, 0, 600, 600, 600, [255, 255, 255]);
  fill(pixels, 510, 525, 15, 30, [90, 180, 20]);
  fill(pixels, 540, 525, 20, 30, [90, 180, 20]);
  fill(pixels, 465, 520, 3, 35, [90, 180, 20]);
  const field = maskBattleField(pixels, findStatsRegion(pixels), "ap", { ap: { left: 500, top: 515, width: 80, height: 44 } });
  expect(field.width).toBe(74); // Original digit strokes and padding, no icons.
  let ink = 0;
  for (let i = 0; i < field.data.length; i += 4)
    if (field.data[i] === 0) ink++;
  expect(ink).toBe((15 + 20) * 30);
});

it("preserves health digit strokes and small thousands separators", () => {
  const pixels = image(600, 1200);
  fill(pixels, 0, 600, 600, 600, [255, 255, 255]);
  fill(pixels, 100, 510, 20, 30, [255, 90, 100]);
  fill(pixels, 140, 510, 20, 30, [255, 90, 100]);
  fill(pixels, 125, 536, 4, 8, [255, 90, 100]);
  const field = maskBattleField(pixels, findStatsRegion(pixels), "health", { health: { left: 80, top: 500, width: 100, height: 59 } });
  let ink = 0;
  for (let i = 0; i < field.data.length; i += 4)
    if (field.data[i] === 0) ink++;
  expect(ink).toBe(2 * 20 * 30 + 4 * 8);
});

it("preserves AP thousands separators below the digit baseline", () => {
  const pixels = image(600, 1200);
  fill(pixels, 0, 600, 600, 600, [255, 255, 255]);
  fill(pixels, 510, 525, 15, 30, [90, 180, 20]);
  fill(pixels, 540, 525, 20, 30, [90, 180, 20]);
  fill(pixels, 530, 555, 4, 4, [90, 180, 20]);
  const field = maskBattleField(pixels, findStatsRegion(pixels), "ap", { ap: { left: 500, top: 515, width: 80, height: 44 } });
  let ink = 0;
  for (let i = 0; i < field.data.length; i += 4)
    if (field.data[i] === 0) ink++;
  expect(ink).toBe((15 + 20) * 30 + 4 * 4);
});

it("preserves antialiased countdown edges as gray instead of erasing them", () => {
  const pixels = image(600, 1200);
  fill(pixels, 0, 600, 600, 600, [255, 255, 255]);
  fill(pixels, 30, 570, 3, 12, [255, 255, 255]);
  fill(pixels, 29, 570, 1, 12, [210, 220, 220]);
  const field = maskBattleField(pixels, findStatsRegion(pixels), "countdown", { countdown: { left: 15, top: 561, width: 405, height: 30 } });
  expect(Array.from(field.data).some((value, i) => i % 4 === 0 && value === 135)).toBe(true);
  expect(Array.from(field.data).some((value, i) => i % 4 === 0 && value === 0)).toBe(true);
});

it("fails clearly when the required panel or colored field is absent", () => {
  const pixels = image(300, 650);
  expect(() => findStatsRegion(pixels)).toThrow(/full screenshot/);
  fill(pixels, 0, 320, 300, 330, [255, 255, 255]);
  expect(() => maskBattleField(pixels, findStatsRegion(pixels), "ap")).toThrow(
    /locate ap/,
  );
});

// Actual 20 × 34 navigation glyph from IMG_4109, independent of the locator's
// smaller template. The fixture uses the measured bubble layout, not its color.
const arrow = `.###................
#####...............
######..............
#######.............
########............
.########...........
..########..........
...########.........
....########........
.....########.......
......########......
.......########.....
........########....
.........########...
..........########..
...........########.
............########
.............#######
............########
...........########.
..........########..
.........########...
........########....
.......########.....
......########......
.....########.......
....########........
..#########.........
.#########..........
.########...........
########............
#######.............
######..............
.###................`.split("\n");

const titleScene = (width = 1179, height = 2556, arrowLeft = 831, arrowTop = 262) => {
  const scale = width / 1179;
  const source = image(1179, Math.ceil(height / scale));
  fill(source, 0, 0, source.width, source.height, [170, 180, 190]);
  const rect = (x: number, y: number, w: number, h: number) =>
    fill(source, x, y, w, h, [255, 255, 255]);
  const labelLeft = 1179 - (arrowLeft + 20 + 61) + 50;
  for (let x = labelLeft + 10; x < arrowLeft - 40; x += 40)
    rect(x, arrowTop - 5, 20, 40);
  arrow.forEach((row, y) => Array.from(row).forEach((pixel, x) => {
    if (pixel === "#") rect(arrowLeft + x, arrowTop + y, 1, 1);
  }));
  // Artwork at the same height as the text, plus a bright curved-edge fragment.
  rect(70, arrowTop, 80, 32);
  rect(arrowLeft + 73, arrowTop - 15, 7, 65);
  const pixels = image(width, height);
  let expectedWhite = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.min(source.width - 1, Math.round(x / scale));
    const sy = Math.min(source.height - 1, Math.round(y / scale));
    const index = (sy * source.width + sx) * 4;
    pixels.data.set(source.data.subarray(index, index + 4), (y * width + x) * 4);
    if (sx >= labelLeft && sx < arrowLeft - 20 && source.data[index] === 255)
      expectedWhite++;
  }
  return { pixels, expectedWhite };
};

it.each([[1179, 2556], [590, 1278], [360, 780], [600, 1000], [600, 1600]])(
  "crops the label without the arrow or artwork at %p × %p",
  (width, height) => {
    const { pixels, expectedWhite } = titleScene(width, height);
    const cropped = cropTitleField(pixels);
    let actual = 0;
    for (let i = 0; i < cropped.data.length; i += 4)
      if (cropped.data[i] === 255) actual++;
    expect(actual).toBe(expectedWhite);
    // Preserve the source image rather than replacing its background/text.
    expect(Array.from(cropped.data.slice(0, 3))).toEqual([170, 180, 190]);
  },
);

it("uses the same padding for a shorter title and a vertically shifted bubble", () => {
  const { pixels } = titleScene(1179, 2556, 733, 390);
  const cropped = cropTitleField(pixels);
  let white = 0;
  for (let i = 0; i < cropped.data.length; i += 4) if (cropped.data[i] === 255) white++;
  expect(white).toBe(7 * 20 * 40);
});

it("preserves detached accents and punctuation inside the label", () => {
  const { pixels } = titleScene();
  fill(pixels, 342, 248, 4, 3, [255, 255, 255]);
  fill(pixels, 790, 268, 3, 16, [255, 255, 255]);
  const cropped = cropTitleField(pixels);
  let white = 0;
  for (let i = 0; i < cropped.data.length; i += 4) if (cropped.data[i] === 255) white++;
  expect(white).toBe(12 * 20 * 40 + 4 * 3 + 3 * 16);
});

it("asks for manual entry when the title arrow cannot be located", () => {
  expect(() => cropTitleField(image(600, 1300))).toThrow(/title/);
});
