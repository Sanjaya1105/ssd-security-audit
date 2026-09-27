const { test } = require('node:test');
const assert = require('node:assert/strict');
const { server, response } = require('./helpers.cjs');
for (const date of ['2026-01-01;whoami', '2026-02-30', '2026-01-01 && echo test', undefined]) {
  test(`A05 invalid date ${String(date)} returns 400 without process execution`, async () => {
    const s = server(), res = response();
    await s.routes['/predict'].at(-1)({ query: { date } }, res);
    assert.equal(res.statusCode, 400); assert.equal(s.calls.length, 0);
  });
}
test('A05 valid leap day invokes fixed script with separate argv', async () => {
  const s = server(), res = response();
  await s.routes['/predict'].at(-1)({ query: { date: '2024-02-29' } }, res);
  assert.equal(res.statusCode, 200); assert.equal(s.calls.length, 1);
  const [executable, args, options] = s.calls[0];
  assert.equal(executable, 'python'); assert.match(args[0], /[\\/]predict\.py$/);
  assert.equal(args[1], '2024-02-29'); assert.equal(args.length, 2);
  assert.notEqual(options.shell, true);
});
