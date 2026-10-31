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

export const maskBattleField = (
  image: PixelImage,
  stats: ImageRegion,
  field: "health" | "ap" | "countdown",
): PixelImage => {
  const { width, height, data } = image;
  const sheetTop = stats.top + stats.height;
  const x0 = Math.floor(
    width * (field === "health" ? 0.105 : field === "ap" ? 0.65 : 0.025),
  );
  const x1 = Math.floor(
    width * (field === "health" ? 0.7 : field === "ap" ? 0.99 : 0.7),
  );
  const y0 =
    field === "countdown" ? Math.floor(sheetTop - height * 0.032) : stats.top;
  const y1 = Math.floor(
    sheetTop - height * (field === "countdown" ? 0.008 : 0.034),
  );
  const cropWidth = x1 - x0;
  const cropHeight = y1 - y0;
  const mask = new Uint8Array(cropWidth * cropHeight);
  for (let y = 0; y < cropHeight; y++) {
    for (let x = 0; x < cropWidth; x++) {
      const i = ((y + y0) * width + x + x0) * 4;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const foreground =
        field === "health"
          ? r > 195 && g < 180 && b < 190 && r > g * 1.3
          : field === "ap"
            ? g > 85 && g > r * 1.3 && g > b * 1.5
            : isWhite(r, g, b);
      if (foreground) mask[y * cropWidth + x] = 1;
    }
  }

  // Erode colored fills to remove the thin Pikmin icons beside AP. Keep the
  // substantial connected digit strokes; commas may disappear harmlessly.
  if (field !== "countdown") {
    const eroded = new Uint8Array(mask.length);
    for (let y = 1; y < cropHeight - 1; y++) {
      for (let x = 1; x < cropWidth - 1; x++) {
        let full = true;
        for (let dy = -1; dy <= 1 && full; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!mask[(y + dy) * cropWidth + x + dx]) {
              full = false;
              break;
            }
          }
        }
        if (full) eroded[y * cropWidth + x] = 1;
      }
    }
    const visited = new Uint8Array(mask.length);
    const components: number[][] = [];
    for (let i = 0; i < eroded.length; i++) {
      if (!eroded[i] || visited[i]) continue;
      const component = [i];
      visited[i] = 1;
      for (let j = 0; j < component.length; j++) {
        const pixel = component[j];
        const x = pixel % cropWidth;
        for (const next of [
          pixel - cropWidth,
          pixel + cropWidth,
          ...(x > 0 ? [pixel - 1] : []),
          ...(x < cropWidth - 1 ? [pixel + 1] : []),
        ]) {
          if (
            next >= 0 &&
            next < eroded.length &&
            eroded[next] &&
            !visited[next]
          ) {
            visited[next] = 1;
            component.push(next);
          }
        }
      }
      components.push(component);
    }
    const largest = Math.max(
      0,
      ...components.map((component) => component.length),
    );
    const componentHeight = (component: number[]) => {
      let top = cropHeight,
        bottom = 0;
      component.forEach((pixel) => {
        const y = Math.floor(pixel / cropWidth);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      });
      return bottom - top + 1;
    };
    const tallest = Math.max(0, ...components.map(componentHeight));
    mask.fill(0);
    for (const component of components) {
      if (
        component.length >= Math.max(12, largest * 0.22) &&
        componentHeight(component) >= tallest * 0.7
      ) {
        component.forEach((pixel) => {
          mask[pixel] = 1;
        });
      }
    }
  }

  let left = cropWidth,
    right = 0,
    top = cropHeight,
    bottom = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const x = i % cropWidth,
      y = Math.floor(i / cropWidth);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  if (left > right || top > bottom)
    throw new Error(`Couldn't locate ${field} in the screenshot.`);
  const outputWidth = right - left + 1 + 24;
  const outputHeight = bottom - top + 1 + 24;
  const output = new Uint8ClampedArray(outputWidth * outputHeight * 4).fill(
    255,
  );
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (!mask[y * cropWidth + x]) continue;
      const i = ((y - top + 12) * outputWidth + x - left + 12) * 4;
      output[i] = output[i + 1] = output[i + 2] = 0;
    }
  }
  return { width: outputWidth, height: outputHeight, data: output };
};

// The title capsule is in the upper image. Mushroom text starts below the
// detected sheet edge and can wrap to two lines for event types.
export const cropIdentityField = (
  image: PixelImage,
  stats: ImageRegion,
  field: "title" | "type",
): PixelImage => {
  const sheetTop = stats.top + stats.height;
  const left = Math.floor(image.width * 0.04);
  const right = Math.ceil(image.width * 0.96);
  const top =
    field === "title"
      ? Math.floor(image.height * 0.075)
      : sheetTop + Math.floor(image.height * 0.025);
  const bottom =
    field === "title"
      ? Math.floor(image.height * 0.15)
      : Math.min(image.height, sheetTop + Math.floor(image.height * 0.13));
  const width = right - left;
  const height = bottom - top;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const start = ((top + y) * image.width + left) * 4;
    data.set(image.data.subarray(start, start + width * 4), y * width * 4);
  }
  return { width, height, data };
};

export const maskTitleField = (image: PixelImage): PixelImage => {
  const top = Math.floor(image.height * 0.055);
  const left = Math.floor(image.width * 0.025);
  const width = Math.floor(image.width * 0.95);
  const height = Math.floor(image.height * 0.13);
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = ((top + y) * image.width + left + x) * 4;
      if (isWhite(image.data[i], image.data[i + 1], image.data[i + 2]))
        mask[y * width + x] = 1;
    }
  const seen = new Uint8Array(mask.length);
  const glyphs: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    center: number;
  }[] = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue;
    const queue = [i];
    seen[i] = 1;
    let minX = width,
      maxX = 0,
      minY = height,
      maxY = 0;
    for (let j = 0; j < queue.length; j++) {
      const pixel = queue[j],
        x = pixel % width,
        y = Math.floor(pixel / width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      for (const next of [
        pixel - width,
        pixel + width,
        ...(x > 0 ? [pixel - 1] : []),
        ...(x < width - 1 ? [pixel + 1] : []),
      ]) {
        if (next >= 0 && next < mask.length && mask[next] && !seen[next]) {
          seen[next] = 1;
          queue.push(next);
        }
      }
    }
    const glyphHeight = maxY - minY + 1;
    if (
      queue.length >= 8 &&
      glyphHeight >= image.height * 0.006 &&
      glyphHeight <= image.height * 0.028 &&
      maxX - minX < image.width * 0.08
    ) {
      glyphs.push({
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY,
        center: (minY + maxY) / 2,
      });
    }
  }
  const groups = glyphs.map((glyph) =>
    glyphs.filter(
      (other) => Math.abs(other.center - glyph.center) < image.height * 0.0075,
    ),
  );
  groups.sort((a, b) => b.length - a.length);
  const line = groups[0];
  if (!line || line.length < 3)
    throw new Error("Couldn't locate the title text.");
  const x0 = Math.min(...line.map((glyph) => glyph.left));
  const x1 = Math.max(...line.map((glyph) => glyph.right));
  const y0 = Math.min(...line.map((glyph) => glyph.top));
  const y1 = Math.max(...line.map((glyph) => glyph.bottom));
  const outputWidth = x1 - x0 + 25;
  const outputHeight = y1 - y0 + 25;
  const data = new Uint8ClampedArray(outputWidth * outputHeight * 4).fill(255);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (!mask[y * width + x]) continue;
      const i = ((y - y0 + 12) * outputWidth + x - x0 + 12) * 4;
      data[i] = data[i + 1] = data[i + 2] = 0;
    }
  return { width: outputWidth, height: outputHeight, data };
};
