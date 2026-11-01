// macOS sample check: exercises production icon crops, OCR, and number parsing
// against manually transcribed values from the original screenshots.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const ts = require('typescript');
const { createWorker, PSM } = require('tesseract.js');

const [directory, option, reportPath] = process.argv.slice(2);
if (!directory || (option && (option !== '--report' || !reportPath))) {
  console.error('Usage: node scripts/check-battle-screenshots.cjs <screenshot-directory> [--report <json-path>]');
  process.exit(1);
}
require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename,
);
const { findStatsRegion, locateBattleFields, maskBattleField } = require('../src/screenshotImage.ts');
const { parseStatNumber, parseScreenshotCountdown } = require('../src/screenshotParsing.ts');
const { numericReadingNeedsReview } = require('../src/screenshotConfidence.ts');
const expectedReadings = require('../src/testFixtures/battleScreenshotReadings.json');

const decodeBmp = (buffer) => {
  const width = buffer.readInt32LE(18), signedHeight = buffer.readInt32LE(22);
  const height = Math.abs(signedHeight), depth = buffer.readInt16LE(28);
  if (buffer.toString('ascii', 0, 2) !== 'BM' || ![24, 32].includes(depth))
    throw new Error('Expected a 24- or 32-bit BMP from sips.');
  const offset = buffer.readUInt32LE(10), stride = Math.ceil(width * depth / 32) * 4;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const j = offset + (signedHeight > 0 ? height - y - 1 : y) * stride + x * depth / 8;
    data.set([buffer[j + 2], buffer[j + 1], buffer[j], 255], i);
  }
  return { width, height, data };
};

const encodeBmp = (pixels) => {
  const stride = Math.ceil(pixels.width * 3 / 4) * 4;
  const buffer = Buffer.alloc(54 + stride * pixels.height);
  buffer.write('BM');
  buffer.writeUInt32LE(buffer.length, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(pixels.width, 18);
  buffer.writeInt32LE(pixels.height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  for (let y = 0; y < pixels.height; y++) for (let x = 0; x < pixels.width; x++) {
    const i = (y * pixels.width + x) * 4;
    const j = 54 + (pixels.height - y - 1) * stride + x * 3;
    buffer[j] = pixels.data[i + 2];
    buffer[j + 1] = pixels.data[i + 1];
    buffer[j + 2] = pixels.data[i];
  }
  return buffer;
};

(async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'pikmin-numeric-check-'));
  let worker;
  const results = [];
  try {
    worker = await createWorker('eng', 1, {
      langPath: path.join(path.dirname(require.resolve('@tesseract.js-data/eng')), '4.0.0_best_int'),
      cachePath: temporary,
    });
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
    for (const expected of expectedReadings) {
      const row = { filename: expected.filename, fields: {}, failures: [] };
      try {
        const converted = path.join(temporary, 'source.bmp');
        execFileSync('sips', ['-s', 'format', 'bmp', path.join(directory, expected.filename), '--out', converted],
          { stdio: 'pipe' });
        const image = decodeBmp(fs.readFileSync(converted));
        const stats = findStatsRegion(image), regions = locateBattleFields(image, stats);
        for (const field of ['health', 'ap', 'countdown']) {
          try {
            const pixels = maskBattleField(image, stats, field, regions);
            const { data } = await worker.recognize(encodeBmp(pixels), {}, { blocks: true });
            const value = field === 'countdown' ? parseScreenshotCountdown(data.text) : parseStatNumber(data.text);
            const words = data.blocks?.flatMap(block => block.paragraphs.flatMap(paragraph =>
              paragraph.lines.flatMap(line => line.words))) ?? [];
            row.fields[field] = { text: data.text.trim(), value,
              needsReview: numericReadingNeedsReview(words), region: regions[field] };
            if (!isDeepStrictEqual(value, expected[field]))
              row.failures.push({ field, expected: expected[field], actual: value });
          } catch (error) {
            row.failures.push({ field, error: error.message });
          }
        }
      } catch (error) {
        row.failures.push({ error: error.message });
      }
      results.push(row);
      if (row.failures.length) console.error(`FAIL ${row.filename}: ${JSON.stringify(row.failures)}`);
    }
  } finally {
    await worker?.terminate();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  const passed = results.filter(row => !row.failures.length).length;
  const report = { screenshots: results.length, passed, failed: results.length - passed, results };
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`${passed}/${results.length} original screenshots matched health, AP, and countdown exactly.`);
  const reviews = results.flatMap(row => Object.values(row.fields)).filter(field => field.needsReview).length;
  if (reviews) console.log(`${reviews} fields also carry the app's digit-confidence review warning.`);
  if (passed !== results.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
