const fs = require('node:fs');
const path = require('node:path');

const destination = path.join(__dirname, '../public/ocr');
fs.mkdirSync(destination, { recursive: true });
const copyAsset = (source, target) => {
  if (fs.existsSync(target) && fs.readFileSync(source).equals(fs.readFileSync(target))) return;
  fs.copyFileSync(source, target);
};
copyAsset(require.resolve('tesseract.js/dist/worker.min.js'), path.join(destination, 'worker.min.js'));
const core = path.dirname(require.resolve('tesseract.js-core/package.json'));
for (const file of fs.readdirSync(core)) {
  if (/\.wasm(?:\.js)?$/.test(file)) copyAsset(path.join(core, file), path.join(destination, file));
}
copyAsset(
  path.join(path.dirname(require.resolve('@tesseract.js-data/eng')), '4.0.0_best_int/eng.traineddata.gz'),
  path.join(destination, 'eng.traineddata.gz'),
);
