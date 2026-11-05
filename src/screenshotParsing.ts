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

// Explicit labels are required even when all four values are present.
// English UI labels plus the German abbreviations already supported by the
// reader; unfamiliar or damaged labels must never become positional guesses.
const COUNTDOWN_LABELS = "days?|hours?|hrs?|minutes?|mins?|seconds?|secs?|tage?|std|sek";

export const parseScreenshotCountdown = (
  text: string,
): TimeRemaining | null => {
  const normalized = normalizeDigits(text).replace(
    new RegExp(`\\b[Oo]\\b(?=\\s*(?:${COUNTDOWN_LABELS})\\b)`, "gi"),
    "0",
  );
  const numbers = normalized.match(/\d+/g)?.map(Number) ?? [];
  const unitValue = new RegExp(`(\\d+)\\s*(${COUNTDOWN_LABELS})\\b`, "gi");
  const matches = Array.from(
    normalized.matchAll(unitValue),
  );
  // A visible unit with an unreadable value (for example "Bmins") is not an
  // omitted unit. Do not silently replace that unreadable number with zero.
  const labels = normalized.match(new RegExp(`(?:${COUNTDOWN_LABELS})\\b`, "gi")) ?? [];
  if (!matches.length || matches.length !== numbers.length || labels.length !== matches.length)
    return null;
  // A damaged label such as "Pays" may have lost its day value too. Unknown
  // words must not be interpreted as an omitted unit with a value of zero.
  const unparsed = normalized
    .replace(unitValue, "")
    .replace(/\bleft\b/gi, "")
    .replace(/[\s.,:;…]/g, "");
  if (unparsed) return null;
  const countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  let previousUnit = -1;
  const units = ["days", "hours", "minutes", "seconds"] as const;
  for (const [, value, label] of matches) {
    const name = label.toLowerCase();
    const field = name.startsWith("d") || name.startsWith("tag")
      ? "days"
      : name.startsWith("h") || name === "std"
        ? "hours"
        : name.startsWith("m")
          ? "minutes"
          : "seconds";
    const index = units.indexOf(field);
    if (index <= previousUnit) return null;
    previousUnit = index;
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
