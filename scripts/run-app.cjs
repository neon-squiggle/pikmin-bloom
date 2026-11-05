const { spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const getBuildVersion = (command, filename = path.join(__dirname, '../build-version.json')) => {
  const { version } = JSON.parse(readFileSync(filename, 'utf8'));
  if (!Number.isSafeInteger(version) || version < 0 || version === Number.MAX_SAFE_INTEGER)
    throw new Error('build-version.json must contain a nonnegative integer version below Number.MAX_SAFE_INTEGER.');
  const next = command === 'build' ? version + 1 : version;
  if (command === 'build') writeFileSync(filename, `${JSON.stringify({ version: next }, null, 2)}\n`);
  return String(next);
};

if (require.main === module) {
  const requestedCommand = process.argv[2];
  const command = requestedCommand === 'check-build' ? 'build' : requestedCommand;
  const version = getBuildVersion(requestedCommand);
  const result = spawnSync(process.execPath, [require.resolve('react-scripts/bin/react-scripts'), command], {
    stdio: 'inherit',
    env: {
      ...process.env,
      REACT_APP_BUILD_VERSION: version,
    },
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

module.exports = { getBuildVersion };
