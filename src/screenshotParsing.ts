import dayjs from "dayjs";
import { parseTimeRemaining } from "./helpers";
import { TimeRemaining } from "./types";

const normalizeDigits = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0));

export const parseStatNumber = (text: string): number | null => {
  const normalized = normalizeDigits(text).trim();
  if (
    !/^\d+$/.test(normalized) &&
    !/^\d{1,3}(?:[\s,.'’]\d{3})+$/.test(normalized)
  )
    return null;
  const number = Number(normalized.replace(/[\s,.'’]/g, ""));
  return Number.isSafeInteger(number) && number > 0 ? number : null;
};

export const parseScreenshotCountdown = (
  text: string,
): TimeRemaining | null => {
  const normalized = normalizeDigits(text).replace(
    /\b[Oo]\b(?=\s*(?:days?|hrs?|hours?|mins?|minutes?|secs?|seconds?)\b)/gi,
    "0",
  );
  const numbers = normalized.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 4) {
    const [days, hours, minutes, seconds] = numbers;
    return parseTimeRemaining({ days, hours, minutes, seconds });
  }
  // A shorter timer is safe only when its unit labels identify omitted units.
  const matches = Array.from(
    normalized.matchAll(
      /(\d+)\s*(days?|hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi,
    ),
  );
  if (!matches.length || matches.length !== numbers.length) return null;
  const countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const seen = new Set<string>();
  for (const [, value, label] of matches) {
    const field = label.toLowerCase().startsWith("d")
      ? "days"
      : label.toLowerCase().startsWith("h")
        ? "hours"
        : label.toLowerCase().startsWith("m")
          ? "minutes"
          : "seconds";
    if (seen.has(field)) return null;
    seen.add(field);
    countdown[field] = Number(value);
  }
  return parseTimeRemaining(countdown);
};

export const parseCaptureTime = (
  metadata: Record<string, unknown>,
): string | null => {
  const date =
    metadata.DateTimeOriginal ?? metadata.CreateDate ?? metadata.DateCreated;
  if (typeof date !== "string") return null;
  const match =
    /^(\d{4})[:-](\d{2})[:-](\d{2})[T ](\d{2}):(\d{2}):(\d{2})(Z|[+-]\d{2}:?\d{2})?$/.exec(
      date.trim(),
    );
  if (!match) return null;
  const [, year, month, day, hour, minute, second, embeddedOffset] = match;
  const offset =
    embeddedOffset ??
    metadata.OffsetTimeOriginal ??
    metadata.OffsetTimeDigitized ??
    "";
  if (
    typeof offset !== "string" ||
    (offset !== "" && !/^(?:Z|[+-](?:0\d|1[0-4]):?[0-5]\d)$/.test(offset))
  )
    return null;
  const local = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  // Validate the calendar date before resolving it in the browser's timezone.
  const validation = new Date(`${local}Z`);
  if (
    !Number.isFinite(validation.valueOf()) ||
    validation.toISOString().slice(0, 19) !== local
  )
    return null;
  const parsed = dayjs(local + offset);
  // Do not silently roll a nonexistent local clock time over a DST gap.
  if (
    !parsed.isValid() ||
    (!offset && parsed.format("YYYY-MM-DDTHH:mm:ss") !== local)
  )
    return null;
  return parsed.toISOString();
};

export const parseMushroomType = (text: string): string | null => {
  const match =
    /\b(small|normal|large|giant)\s+([\p{L}\p{N}][\p{L}\p{N}'’ &-]*?)\s+mushroom\b/iu.exec(
      text.replace(/\s+/g, " "),
    );
  if (!match) return null;
  const size = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
  return `${size} ${match[2].trim()} Mushroom`;
};

export const parseMushroomTitle = (text: string): string | null => {
  return text.trim().replace(/\s+/g, " ") || null;
};
