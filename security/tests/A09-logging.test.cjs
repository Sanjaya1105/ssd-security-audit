const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers.cjs');
function setup() {
  const entries = [];
  const logger = load('utils/securityLogger.js', { fs: { existsSync: () => true,
    appendFileSync: (file, line) => entries.push(JSON.parse(line)) } });
  return { logger, entries };
}
test('A09-T01 top-level secrets removed from structured log', () => {
  const { logger, entries } = setup();
  logger.logSecurityEvent('TEST', { password: 'fake-password', token: 'fake-token', code: '123456' });
  assert.equal(entries.length, 1); assert.equal(entries[0].event, 'TEST');
  for (const field of ['password', 'token', 'code']) assert.equal(Object.hasOwn(entries[0], field), false);
});
test('A09-T02 five failed logins produce brute-force alert', () => {
  const { logger, entries } = setup();
  for (let i = 0; i < 5; i++) logger.noteFailedLogin({ ip: 'test-address' }, 'test@example.invalid');
  assert.equal(entries.filter(x => x.event === 'LOGIN_FAILURE').length, 5);
  assert.equal(entries.filter(x => x.event === 'ALERT_BRUTE_FORCE').length, 1);
});
test('A09-T03 OAuth query secrets MUST NOT enter log output (regression)', () => {
  const { logger, entries } = setup();
  logger.logSecurityEvent('OAUTH_SUCCESS', {}, {
    ip: 'test-address', originalUrl: '/callback?code=FAKE_CODE_MARKER&state=FAKE_STATE_MARKER' });
  assert.doesNotMatch(JSON.stringify(entries), /FAKE_CODE_MARKER|FAKE_STATE_MARKER/);
});
