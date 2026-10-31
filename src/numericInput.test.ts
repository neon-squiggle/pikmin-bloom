import { formatNumericInput, parseNumericInput } from "./numericInput";

it.each(["en-US", "de-DE", "fr-FR", "hi-IN", "ar-EG"])(
  "round trips grouped and decimal numbers in %s",
  (locale) => {
    for (const value of [0, 1234, 1234567, 1.5, 1234.567]) {
      expect(
        parseNumericInput(formatNumericInput(value, locale), true, locale),
      ).toBe(value);
    }
    for (const value of [0, 1234, 1234567])
      expect(
        parseNumericInput(formatNumericInput(value, locale), false, locale),
      ).toBe(value);
  },
);
it("rejects fractional integers and malformed grouping rather than dropping punctuation", () => {
  expect(parseNumericInput("1,5", false, "de-DE")).toBeNull();
  expect(parseNumericInput("1,5", true, "de-DE")).toBe(1.5);
  expect(parseNumericInput("1.5", false, "de-DE")).toBeNull();
  expect(parseNumericInput("1,23", false, "en-US")).toBeNull();
});
