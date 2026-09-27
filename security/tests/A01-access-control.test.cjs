const { test } = require('node:test');
const assert = require('node:assert/strict');
const { auth, users, load, response } = require('./helpers.cjs');

test('A01-T01 missing authentication returns 401', () => {
  const res = response();
  auth().authenticateUser({ cookies: {}, header: () => undefined }, res,
    () => assert.fail('Unauthenticated request continued'));
  assert.equal(res.statusCode, 401);
});
test('A01-T02 customer denied; admin allowed by role middleware', () => {
  const gate = auth().authorizeRole(['admin']);
  const res = response(); let continued = false;
  gate({ user: { role: 'customer' } }, res, () => assert.fail('Customer allowed'));
  assert.equal(res.statusCode, 403);
  gate({ user: { role: 'admin' } }, response(), () => { continued = true; });
  assert.equal(continued, true);
});
test('A01-T03 customer cannot read another user; database untouched', async () => {
  const res = response(); let queries = 0;
  await users().getUserById({ user: { user_id: 1, role: 'customer' }, params: { id: 2 },
    db: { execute() { queries++; } } }, res);
  assert.equal(res.statusCode, 403); assert.equal(queries, 0);
});
test('A01-T04 customer order update MUST be denied without a write (regression)', async () => {
  const controller = load('controller/OrderController.js', {
    '../utils/emailService': { sendOrderConfirmation: async () => {} }
  });
  let writes = 0;
  const res = response();
  const db = { promise: () => ({ execute: async sql => {
    if (sql.startsWith('SELECT')) return [[{ order_id: 20, user_id: 2, order_type: 'DIRECT_SALE' }]];
    writes++; return [{ affectedRows: 1 }];
  } }) };
  await controller.updateOrderStatus({ user: { user_id: 1, role: 'customer' },
    params: { orderId: 20 }, body: { order_status: 'CANCELLED' }, db }, res);
  assert.deepEqual({ status: res.statusCode, writes }, { status: 403, writes: 0 });
});
