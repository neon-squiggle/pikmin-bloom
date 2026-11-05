// A minimum acceptance threshold, not a probability that the reading is correct.
export const NUMERIC_OCR_REVIEW_THRESHOLD = 75;

interface OcrWord {
  text: string;
  confidence: number;
  symbols?: { text: string; confidence: number }[];
}

const isConfident = (confidence: number) =>
  Number.isFinite(confidence) &&
  confidence >= NUMERIC_OCR_REVIEW_THRESHOLD && confidence <= 100;

// Ignore labels/language and inspect digits individually so a confident field
// average cannot hide an uncertain digit. Fall back only for purely numeric words.
export const numericReadingNeedsReview = (words: OcrWord[]) => {
  let foundDigits = false;
  for (const word of words) {
    const count = word.text.normalize("NFKC").match(/\p{Nd}/gu)?.length ?? 0;
    if (!count) continue;
    foundDigits = true;
    const digits =
      word.symbols?.flatMap((symbol) =>
        (symbol.text.normalize("NFKC").match(/\p{Nd}/gu) ?? []).map(() => symbol.confidence),
      );
    if (digits?.length) {
      if (digits.length !== count || digits.some((confidence) => !isConfident(confidence))) return true;
    } else if (
      !/^\p{Nd}[\p{Nd}\s,.'’]*$/u.test(word.text.normalize("NFKC").trim()) ||
      !isConfident(word.confidence)
    ) return true;
  }
  return !foundDigits;
};
