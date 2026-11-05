const assert = require('node:assert/strict');
const { test } = require('node:test');
const { execFileSync } = require('node:child_process');
const { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
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
  assert.equal(getBuildVersion('check-build', filename), '3');
  assert.deepEqual(JSON.parse(readFileSync(filename, 'utf8')), { version: 3 });
});

test('the real npm lifecycle increments deploy once and does not increment validation builds', (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'pikmin-npm-lifecycle-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const write = (name, contents) => {
    const filename = path.join(directory, name);
    mkdirSync(path.dirname(filename), { recursive: true });
    writeFileSync(filename, contents);
  };
  copyFileSync(require.resolve('../package.json'), path.join(directory, 'package.json'));
  write('build-version.json', '{"version":10}\n');
  write('scripts/run-app.cjs', readFileSync(require.resolve('./run-app.cjs'), 'utf8'));
  // Exercise the actual npm hooks and wrapper; replace costly compilation,
  // asset copying, and publishing at their executable boundaries. No push runs.
  write('scripts/prepare-ocr.cjs', '');
  write('node_modules/react-scripts/bin/react-scripts.js', `
    const fs = require('node:fs');
    const version = process.env.REACT_APP_BUILD_VERSION;
    fs.writeFileSync('compiled-version.txt', version);
    fs.appendFileSync('lifecycle.jsonl', JSON.stringify({ action: 'build', command: process.argv[2], version }) + '\\n');
  `);
  write('node_modules/.bin/gh-pages', `#!/usr/bin/env node
    const fs = require('node:fs');
    fs.appendFileSync('lifecycle.jsonl', JSON.stringify({ action: 'publish', version: fs.readFileSync('compiled-version.txt', 'utf8') }) + '\\n');
  `);
  chmodSync(path.join(directory, 'node_modules/.bin/gh-pages'), 0o755);
  const run = (name) => execFileSync('npm', ['run', name, '--silent'], {
    cwd: directory, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, npm_config_ignore_scripts: 'false' },
  });
  const savedVersion = () => JSON.parse(readFileSync(path.join(directory, 'build-version.json'), 'utf8')).version;
  const events = () => readFileSync(path.join(directory, 'lifecycle.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  run('deploy');
  assert.equal(savedVersion(), 11);
  assert.deepEqual(events(), [
    { action: 'build', command: 'build', version: '11' },
    { action: 'publish', version: '11' },
  ]);
  run('build:check');
  assert.equal(savedVersion(), 11);
  assert.deepEqual(events().at(-1), { action: 'build', command: 'build', version: '11' });
  run('build');
  assert.equal(savedVersion(), 12);
  assert.deepEqual(events().at(-1), { action: 'build', command: 'build', version: '12' });
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
