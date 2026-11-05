export const formatNumericInput = (
  value: number | null | undefined,
  locale?: string,
  useGrouping = true,
) =>
  value == null || !Number.isFinite(value)
    ? ""
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 3, useGrouping }).format(value);

export const parseNumericInput = (
  raw: string,
  allowDecimal: boolean,
  locale?: string,
): number | null => {
  const formatter = new Intl.NumberFormat(locale);
  const parts = formatter.formatToParts(12345.6);
  const decimal = parts.find((part) => part.type === "decimal")?.value ?? ".";
  const group = parts.find((part) => part.type === "group")?.value;
  let value = raw.replace(/[\u061c\u200e\u200f]/g, "").trim();
  const digitFormatter = new Intl.NumberFormat(locale, { useGrouping: false });
  for (let digit = 0; digit <= 9; digit++)
    value = value.split(digitFormatter.format(digit)).join(String(digit));
  const segments = value.split(decimal);
  if (segments.length > 2 || (!allowDecimal && segments.length > 1))
    return null;
  let integer = segments[0];
  if (group && !/\s/.test(group) && integer.includes(group)) {
    const digits = integer.split(group).join("");
    if (!/^\d+$/.test(digits)) return null;
    // Reject malformed grouping rather than silently changing the value.
    const expected = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    }).format(Number(digits));
    const normalizedExpected = Array.from(expected)
      .map((character) => {
        for (let digit = 0; digit <= 9; digit++)
          if (digitFormatter.format(digit) === character) return String(digit);
        return character;
      })
      .join("");
    if (integer !== normalizedExpected) return null;
    integer = digits;
  }
  integer = integer.replace(/\s/g, "");
  value = integer + (segments.length === 2 ? `.${segments[1]}` : "");
  if (!(allowDecimal ? /^(?:\d+(?:\.\d*)?|\.\d+)$/ : /^\d+$/).test(value))
    return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
