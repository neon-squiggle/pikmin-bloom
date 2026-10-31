import {
  findStatsRegion,
  maskBattleField,
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

it("removes the thin green icons beside substantial AP digits", () => {
  const pixels = image(600, 1200);
  fill(pixels, 0, 600, 600, 600, [255, 255, 255]);
  fill(pixels, 510, 525, 15, 30, [90, 180, 20]);
  fill(pixels, 540, 525, 20, 30, [90, 180, 20]);
  fill(pixels, 465, 520, 3, 35, [90, 180, 20]);
  const field = maskBattleField(pixels, findStatsRegion(pixels), "ap");
  expect(field.width).toBe(72); // Only the two digits and their padding.
});

it("fails clearly when the required panel or colored field is absent", () => {
  const pixels = image(300, 650);
  expect(() => findStatsRegion(pixels)).toThrow(/full screenshot/);
  fill(pixels, 0, 320, 300, 330, [255, 255, 255]);
  expect(() => maskBattleField(pixels, findStatsRegion(pixels), "ap")).toThrow(
    /locate ap/,
  );
});
