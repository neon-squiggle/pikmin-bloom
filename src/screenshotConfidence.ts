// This is a review heuristic, not a probability that the reading is correct.
export const NUMERIC_OCR_REVIEW_THRESHOLD = 75;

interface OcrWord {
  text: string;
  confidence: number;
  symbols?: { text: string; confidence: number }[];
}

const isLowConfidence = (confidence: number) =>
  Number.isFinite(confidence) &&
  confidence >= 0 &&
  confidence < NUMERIC_OCR_REVIEW_THRESHOLD;

// Ignore labels/language and inspect digits individually so a confident field
// average cannot hide an uncertain digit. Fall back only for purely numeric words.
export const numericReadingNeedsReview = (words: OcrWord[]) =>
  words.some((word) => {
    const digits =
      word.symbols?.filter((symbol) =>
        /\p{Nd}/u.test(symbol.text.normalize("NFKC")),
      ) ?? [];
    if (digits.length)
      return digits.some((symbol) => isLowConfidence(symbol.confidence));
    return (
      /^\p{Nd}[\p{Nd}\s,.'’]*$/u.test(word.text.normalize("NFKC").trim()) &&
      isLowConfidence(word.confidence)
    );
  });
