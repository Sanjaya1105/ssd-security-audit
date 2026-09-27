const { test } = require('node:test');
const assert = require('node:assert/strict');
const { server, response } = require('./helpers.cjs');
test('A02-T01 hardening middleware sets headers and disables framework disclosure', () => {
  const s = server(), res = response();
  for (const [fn] of s.middleware) if (typeof fn === 'function' && fn.length === 3)
    fn({}, res, () => {});
  assert.ok(s.disabled.includes('x-powered-by'));
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(res.headers['X-Frame-Options'], 'DENY');
  assert.equal(res.headers['Referrer-Policy'], 'no-referrer');
});
test('A02-T02 registered ML role gates deny customers and allow managers', () => {
  const s = server();
  for (const url of ['/predict', '/train-model']) {
    const res = response(); let allowed = false;
    s.routes[url][1]({ user: { role: 'customer' } }, res, () => assert.fail('Customer allowed'));
    assert.equal(res.statusCode, 403);
    s.routes[url][1]({ user: { role: 'manager' } }, response(), () => { allowed = true; });
    assert.equal(allowed, true);
  }
});
test('A02-T03 CORS configured for explicit frontend origin with credentials', () => {
  const options = server().middleware.find(([x]) => x?.corsOptions)[0].corsOptions;
  assert.equal(options.origin, 'http://localhost:5173');
  assert.equal(options.credentials, true);
});
