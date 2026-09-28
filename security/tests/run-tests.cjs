const { readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const files = readdirSync(__dirname)
  .filter(name => name.endsWith('.test.cjs'))
  .sort()
  .map(name => path.join(__dirname, name));
if (!files.length) throw new Error('No security test files found');
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
