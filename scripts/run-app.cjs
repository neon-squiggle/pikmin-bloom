const { spawnSync } = require('node:child_process');

// A numeric identifier for this build, without maintaining a version counter.
const version = Math.floor(Date.now() / 1000).toString();
const result = spawnSync(process.execPath, [require.resolve('react-scripts/bin/react-scripts'), process.argv[2]], {
  stdio: 'inherit',
  env: {
    ...process.env,
    REACT_APP_BUILD_VERSION: version,
  },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
