import {
  numericReadingNeedsReview,
  NUMERIC_OCR_REVIEW_THRESHOLD,
} from "./screenshotConfidence";

it("flags one uncertain digit even when the word average is high", () => {
  expect(
    numericReadingNeedsReview([
      {
        text: "17510",
        confidence: 98,
        symbols: [
          { text: "1", confidence: 99 },
          { text: "7", confidence: 45 },
          { text: "5", confidence: 99 },
        ],
      },
    ]),
  ).toBe(true);
});
it("ignores uncertain language and punctuation around confident countdown digits", () => {
  expect(
    numericReadingNeedsReview([
      { text: "2", confidence: 98, symbols: [{ text: "2", confidence: 99 }] },
      {
        text: "jours",
        confidence: 12,
        symbols: [{ text: "j", confidence: 10 }],
      },
      {
        text: "38mins.",
        confidence: 28,
        symbols: [
          { text: "3", confidence: 98 },
          { text: "8", confidence: 98 },
          { text: "m", confidence: 20 },
          { text: ".", confidence: 0 },
        ],
      },
    ]),
  ).toBe(false);
});
it("supports numeric word confidence when symbol detail is unavailable", () => {
  expect(numericReadingNeedsReview([{ text: "17,510", confidence: 40 }])).toBe(
    true,
  );
  expect(
    numericReadingNeedsReview([
      { text: "10", confidence: NUMERIC_OCR_REVIEW_THRESHOLD },
    ]),
  ).toBe(false);
  expect(numericReadingNeedsReview([{ text: "10sec", confidence: 10 }])).toBe(
    false,
  );
});
it("handles Unicode digits while ignoring missing or invalid confidence scores", () => {
  expect(
    numericReadingNeedsReview([
      {
        text: "３８",
        confidence: 99,
        symbols: [{ text: "３", confidence: 60 }],
      },
    ]),
  ).toBe(true);
  expect(numericReadingNeedsReview([{ text: "٢", confidence: 60 }])).toBe(true);
  expect(
    numericReadingNeedsReview([
      { text: "10", confidence: -1 },
      { text: "10", confidence: Number.NaN },
    ]),
  ).toBe(false);
  expect(numericReadingNeedsReview([])).toBe(false);
});
