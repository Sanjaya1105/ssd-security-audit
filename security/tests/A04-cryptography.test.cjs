const { test } = require('node:test');
const assert = require('node:assert/strict');
const { server, users, response } = require('./helpers.cjs');
test('A04-T01 missing and short JWT secrets stop startup', () => {
  for (const secret of ['', 'short']) assert.throws(() => server(secret), /EXIT:1/);
  assert.doesNotThrow(() => server());
});
test('A04-T02 password recovery uses cryptographic randomInt and stores its result', async () => {
  let stored, randomCalls = 0;
  const controller = users({ crypto: { randomInt(min, max) {
    assert.equal(min, 100000); assert.equal(max, 1000000); randomCalls++; return 123456;
  } } });
  const res = response();
  await controller.forgetPassword({ body: { email: 'test@example.invalid' }, db: {
    execute(sql, values, cb) {
      if (sql.startsWith('SELECT')) cb(null, [{ user_id: 1 }]);
      else { stored = values; cb(null); }
    }
  } }, res);
  await res.done;
  assert.equal(res.statusCode, 200); assert.equal(randomCalls, 1);
  assert.equal(stored[0], '123456');
  assert.ok(stored[1].getTime() > Date.now());
});
