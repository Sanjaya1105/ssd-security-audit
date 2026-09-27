const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, response, logger } = require('./helpers.cjs');
function setup(status = 'requires_payment_method') {
  const calls = { created: [], stock: 0, queries: 0 };
  const controller = load('controller/paymentController.js', {
    stripe: () => ({ paymentIntents: {
      create: async data => { calls.created.push(data); return { id: 'test_pi', client_secret: 'fake' }; },
      retrieve: async () => ({ status, metadata: { order_id: '20' } }) } }),
    './OrderController': { processOrder: async () => { calls.stock++; },
      deductDirectSaleStock: async () => { calls.stock++; } }, '../utils/securityLogger': logger });
  const db = { promise: () => ({
    execute: async sql => { calls.queries++; return sql.trim().startsWith('SELECT')
      ? [[{ order_id: 20, user_id: 1, total_amount: '125.50', order_status: 'PENDING' }]] : [{}]; },
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}
  }) };
  return { controller, calls, db };
}
test('A06-T01 client amount ignored; Stripe receives database total in cents', async () => {
  const { controller, calls, db } = setup(), res = response();
  await controller.createPaymentIntent({ user: { user_id: 1 }, body: { order_id: 20, amount: 1 }, db }, res);
  assert.equal(res.statusCode, 200); assert.equal(calls.created.length, 1);
  assert.equal(calls.created[0].amount, 12550); assert.equal(calls.stock, 0);
});
test('A06-T02 another user cannot create payment for this order', async () => {
  const { controller, calls, db } = setup(), res = response();
  await controller.createPaymentIntent({ user: { user_id: 2 }, body: { order_id: 20 }, db }, res);
  assert.equal(res.statusCode, 403); assert.equal(calls.created.length, 0);
});
test('A06-T03 unsuccessful Stripe payment cannot trigger stock deduction', async () => {
  const { controller, calls, db } = setup(), res = response();
  await controller.confirmPayment({ user: { user_id: 1 }, body: { order_id: 20 },
    params: { paymentIntentId: 'test_pi' }, db }, res);
  assert.equal(res.statusCode, 400); assert.equal(calls.stock, 0); assert.equal(calls.queries, 0);
});
