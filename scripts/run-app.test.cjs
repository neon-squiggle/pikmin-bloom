const assert = require('node:assert/strict');
const { test } = require('node:test');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { getBuildVersion } = require('./run-app.cjs');

test('builds increment a persistent counter, while development starts reuse it', (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'pikmin-build-version-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'build-version.json');
  writeFileSync(filename, '{"version":0}\n');
  assert.equal(getBuildVersion('start', filename), '0');
  assert.equal(getBuildVersion('build', filename), '1');
  assert.equal(getBuildVersion('start', filename), '1');
  assert.equal(getBuildVersion('build', filename), '2');
  const next = execFileSync(process.execPath, ['-e',
    'process.stdout.write(require(process.argv[2]).getBuildVersion("build", process.argv[1]))',
    filename, require.resolve('./run-app.cjs')], { encoding: 'utf8' });
  assert.equal(next, '3');
  assert.deepEqual(JSON.parse(readFileSync(filename, 'utf8')), { version: 3 });
});

test('an invalid counter fails without silently resetting its saved value', (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'pikmin-invalid-version-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'build-version.json');
  const original = '{"version":-1}\n';
  writeFileSync(filename, original);
  assert.throws(() => getBuildVersion('build', filename), /nonnegative integer/);
  assert.equal(readFileSync(filename, 'utf8'), original);
});
