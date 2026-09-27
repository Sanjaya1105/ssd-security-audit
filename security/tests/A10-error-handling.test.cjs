const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, response, logger } = require('./helpers.cjs');
const handlers = () => load('middleware/errorHandler.js', { '../utils/securityLogger': logger });
test('A10-T01 internal exception returns generic 500 without SQL or stack', () => {
  const res = response();
  handlers().errorHandler(new Error('ER_BAD_FIELD_ERROR SQL private_table'),
    { method: 'GET', originalUrl: '/test' }, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.doesNotMatch(JSON.stringify(res.body), /private_table|ER_BAD_FIELD|stack/);
  assert.equal(res.body.success, false);
});
test('A10-T02 JSON response sanitizer removes top-level internal details', () => {
  const res = response(); handlers().sanitizeResponses({}, res, () => {});
  res.status(500).json({ message: 'SQL syntax error', stack: 'private-stack', sql: 'SELECT secret', errno: 1 });
  assert.doesNotMatch(JSON.stringify(res.body), /private-stack|SELECT|errno|syntax/);
});
test('A10-T03 unknown route produces generic 404', () => {
  const res = response(); handlers().notFoundHandler({}, res);
  assert.equal(res.statusCode, 404); assert.equal(res.body.message, 'Not found');
});
