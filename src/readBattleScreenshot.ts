import type { Worker } from "tesseract.js";
import {
  cropIdentityField,
  findStatsRegion,
  maskBattleField,
  maskTitleField,
  PixelImage,
} from "./screenshotImage";
import {
  parseCaptureTime,
  parseMushroomTitle,
  parseMushroomType,
  parseScreenshotCountdown,
  parseStatNumber,
} from "./screenshotParsing";
import { TimeRemaining } from "./types";
import { numericReadingNeedsReview } from "./screenshotConfidence";

export interface BattleScreenshotResult {
  healthRemaining: number | null;
  currentAp: number | null;
  countdown: TimeRemaining | null;
  capturedAt: string | null;
  warnings: string[];
  filename: string;
  title?: string | null;
  mushroomType?: string | null;
}

const abortError = () =>
  new DOMException("Screenshot reading canceled", "AbortError");

const abortable = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });

const loadPixels = async (
  file: File,
  signal: AbortSignal,
): Promise<PixelImage> => {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await abortable(image.decode(), signal);
    if (
      image.width < 240 ||
      image.height < 400 ||
      image.width >= image.height
    ) {
      throw new Error(
        "Use a full portrait screenshot with the battle stats visible.",
      );
    }
    if (image.width * image.height > 24_000_000)
      throw new Error(
        "This image is too large. Use the original phone screenshot or resize it below 24 megapixels.",
      );
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / image.width);
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context)
      throw new Error("Image reading is unavailable in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const toCanvas = (image: PixelImage) => {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Image reading is unavailable in this browser.");
  const pixels = context.createImageData(image.width, image.height);
  pixels.data.set(image.data);
  context.putImageData(pixels, 0, 0);
  return canvas;
};

export const readBattleScreenshot = async (
  file: File,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  includeIdentity = false,
): Promise<BattleScreenshotResult> => {
  if (
    !/^(image\/(png|jpeg|webp))$/.test(file.type) &&
    !/\.(png|jpe?g|webp)$/i.test(file.name)
  ) {
    throw new Error("Choose a PNG, JPEG, or WebP screenshot.");
  }
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose a screenshot smaller than 20 MB.");
  onProgress("Finding battle stats…");
  const image = await loadPixels(file, signal).catch((error) => {
    if (error instanceof Error && error.name === "EncodingError")
      throw new Error(
        "Couldn't open this image. Try an original PNG or JPEG screenshot.",
      );
    throw error;
  });
  const stats = findStatsRegion(image);
  const { parse } = await import("exifr");
  let capturedAt: string | null = null;
  try {
    const metadata = await abortable(
      parse(file, {
        reviveValues: false,
        xmp: true,
        pick: [
          "DateTimeOriginal",
          "CreateDate",
          "DateCreated",
          "OffsetTimeOriginal",
          "OffsetTimeDigitized",
        ],
      }),
      signal,
    );
    capturedAt = parseCaptureTime(metadata ?? {});
  } catch {
    /* Metadata can be absent or damaged without preventing OCR. */
  }

  const result: BattleScreenshotResult = {
    healthRemaining: null,
    currentAp: null,
    countdown: null,
    capturedAt,
    warnings: [],
    filename: file.name,
  };
  let worker: Worker | undefined;
  const terminate = () => {
    void worker?.terminate();
  };
  signal.addEventListener("abort", terminate, { once: true });
  try {
    if (signal.aborted) throw abortError();
    const { createWorker, PSM } = await import("tesseract.js");
    if (signal.aborted) throw abortError();
    const base = new URL(
      `${process.env.PUBLIC_URL || ""}/ocr/`,
      window.location.href,
    ).href.replace(/\/$/, "");
    onProgress("Loading screenshot reader…");
    await abortable(
      createWorker("eng", 1, {
        workerPath: `${base}/worker.min.js`,
        corePath: base,
        langPath: base,
        workerBlobURL: false,
        errorHandler: () => {
          /* Rejections are surfaced by the upload control. */
        },
      }).then((created) => {
        worker = created;
        if (signal.aborted) terminate();
      }),
      signal,
    );
    if (!worker || signal.aborted) throw abortError();
    await abortable(
      worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE }),
      signal,
    );
    for (const field of ["health", "ap", "countdown"] as const) {
      onProgress(
        `Reading ${field === "health" ? "remaining health" : field === "ap" ? "AP" : "countdown"}…`,
      );
      let canvas: HTMLCanvasElement;
      try {
        canvas = toCanvas(maskBattleField(image, stats, field));
      } catch {
        result.warnings.push(`Couldn't locate ${field}. Enter it manually.`);
        continue;
      }
      const { data } = await abortable(
        worker.recognize(canvas, {}, { blocks: true }),
        signal,
      );
      if (field === "countdown")
        result.countdown = parseScreenshotCountdown(data.text);
      else {
        const number = parseStatNumber(data.text);
        if (field === "health") result.healthRemaining = number;
        else result.currentAp = number;
      }
      const value =
        field === "health"
          ? result.healthRemaining
          : field === "ap"
            ? result.currentAp
            : result.countdown;
      if (value == null)
        result.warnings.push(
          `Couldn't read ${field === "health" ? "remaining health" : field}. Enter it manually.`,
        );
      else if (
        numericReadingNeedsReview(
          data.blocks?.flatMap((block) =>
            block.paragraphs.flatMap((paragraph) =>
              paragraph.lines.flatMap((line) => line.words),
            ),
          ) ?? [],
        )
      ) {
        result.warnings.push(
          `Check ${field === "health" ? "remaining health" : field === "ap" ? "AP" : "countdown"}; some digits were unclear.`,
        );
      }
    }
    if (
      result.healthRemaining == null &&
      result.currentAp == null &&
      result.countdown == null
    ) {
      throw new Error(
        "Couldn't read the battle stats. Try a clearer full screenshot, or enter the values manually.",
      );
    }
    if (includeIdentity) {
      for (const field of ["title", "type"] as const) {
        onProgress(`Reading mushroom ${field}…`);
        await abortable(
          worker.setParameters({
            tessedit_pageseg_mode:
              field === "title" ? PSM.SINGLE_LINE : PSM.SINGLE_BLOCK,
          }),
          signal,
        );
        let pixels: PixelImage;
        try {
          pixels =
            field === "title"
              ? maskTitleField(image)
              : cropIdentityField(image, stats, field);
        } catch {
          result.warnings.push(
            `Couldn't locate mushroom ${field}. Enter it in the review.`,
          );
          continue;
        }
        const { data } = await abortable(
          worker.recognize(toCanvas(pixels)),
          signal,
        );
        if (field === "title") result.title = parseMushroomTitle(data.text);
        else result.mushroomType = parseMushroomType(data.text);
        if (!(field === "title" ? result.title : result.mushroomType))
          result.warnings.push(
            `Couldn't read mushroom ${field}. Enter it in the review.`,
          );
      }
    }
    return result;
  } finally {
    signal.removeEventListener("abort", terminate);
    await worker?.terminate();
  }
};
