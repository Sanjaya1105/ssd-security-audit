const { test } = require('node:test');
const assert = require('node:assert/strict');
const { users, response, load, logger } = require('./helpers.cjs');
for (const mode of ['missing', 'wrong', 'expired', 'valid']) {
  test(`A07 reset with ${mode} OTP`, async () => {
    let writes = 0, updateSql = '';
    const res = response();
    const db = { execute(sql, args, cb) {
      if (sql.startsWith('SELECT')) cb(null, [{ reset_code: '123456',
        reset_code_expiry: new Date(Date.now() + (mode === 'expired' ? -60000 : 60000)) }]);
      else { writes++; updateSql = sql; cb(null); }
    } };
    await users().resetPassword({ body: { email: 'test@example.invalid', newPassword: 'Test-only-password',
      code: mode === 'missing' ? undefined : mode === 'wrong' ? '999999' : '123456' }, db }, res);
    await res.done;
    assert.equal(res.statusCode, mode === 'valid' ? 200 : 400);
    assert.equal(writes, mode === 'valid' ? 1 : 0);
    if (mode === 'valid') assert.match(updateSql, /reset_code = NULL, reset_code_expiry = NULL/);
  });
}
test('A07 ninth authentication attempt is rate limited', () => {
  const { rateLimiter } = load('middleware/rateLimiter.js', { '../utils/securityLogger': logger });
  const limit = rateLimiter({ max: 8 }), req = { ip: 'test-address' };
  let allowed = 0;
  for (let i = 0; i < 8; i++) limit(req, response(), () => { allowed++; });
  const res = response(); limit(req, res, () => { allowed++; });
  assert.equal(allowed, 8); assert.equal(res.statusCode, 429);
});
