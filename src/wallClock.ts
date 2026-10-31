export const isTimezone = (zone: string) => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const clockFormatters = new Map<string, Intl.DateTimeFormat>();
export const localDateTime = (instant: number, timezone: string) => {
  if (!clockFormatters.has(timezone))
    clockFormatters.set(
      timezone,
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }),
    );
  const parts = clockFormatters.get(timezone)!.formatToParts(new Date(instant));
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}`;
};

// Resolve a wall clock in an IANA zone. Gaps produce no candidates; repeated
// clocks produce both, so the UI can ask which occurrence the user means.
export const finishTimeCandidates = (
  wallTime: string,
  timezone: string,
): number[] => {
  // Native datetime-local fields may serialize whole seconds with .000.
  wallTime = wallTime.replace(/\.0+$/, "");
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(wallTime) ||
    !isTimezone(timezone)
  )
    return [];
  const normalized = wallTime.length === 16 ? `${wallTime}:00` : wallTime;
  const target = Date.parse(`${normalized}Z`);
  if (
    !Number.isFinite(target) ||
    new Date(target).toISOString().slice(0, 19) !== normalized
  )
    return [];
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = target + hours * 3600000;
    offsets.add(Date.parse(`${localDateTime(sample, timezone)}Z`) - sample);
  }
  return Array.from(offsets)
    .map((offset) => target - offset)
    .filter((candidate) => localDateTime(candidate, timezone) === normalized)
    .sort((a, b) => a - b);
};

export const selectedFinishTime = (
  wallTime: string,
  timezone: string,
  occurrence: string,
) => {
  const candidates = finishTimeCandidates(wallTime, timezone);
  if (candidates.length === 1) return candidates[0];
  return occurrence && candidates.includes(Number(occurrence))
    ? Number(occurrence)
    : null;
};

// Native date editing can turn the second repeated clock back into the first.
// Carry the selected occurrence through edits within the repeated interval.
export const preserveClockOccurrence = (
  next: number,
  previous: number | undefined,
  timezone: string,
) => {
  if (previous == null || !Number.isFinite(previous)) return next;
  const before = finishTimeCandidates(localDateTime(previous, timezone), timezone);
  const after = finishTimeCandidates(localDateTime(next, timezone), timezone);
  const occurrence = before.indexOf(Math.floor(previous / 1000) * 1000);
  return before.length > 1 && after.length > 1 && occurrence >= 0
    ? after[occurrence] + next % 1000
    : next;
};

