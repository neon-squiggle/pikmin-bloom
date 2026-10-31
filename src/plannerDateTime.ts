const formatters = new Map<string, Intl.DateTimeFormat>();

// Compact timestamps shared by import review, start details and schedule rows.
// Date-only headings and exact DST-occurrence labels intentionally differ.
export const formatPlannerDateTime = (
  instant: string | number,
  timezone: string,
) => {
  if (!formatters.has(timezone))
    formatters.set(
      timezone,
      new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    );
  return formatters.get(timezone)!.format(new Date(instant));
};
