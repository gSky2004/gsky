const { query, transaction } = require('../db/pool');
const { generateReference } = require('../utils/helpers');
const emailService = require('./emailService');
const env = require('../config/env');

/**
 * Payment service — modular provider interface.
 *
 * A provider must expose:
 *   createPayment({ order, method, customer }) -> { reference, checkoutUrl, instructions }
 *   verifyPayment(reference)                  -> { status: 'COMPLETED'|'PENDING'|'FAILED', transactionReference }
 *   handleWebhook(req)                        -> { reference, status, transactionReference }
 *
 * Current providers: sandbox (simulated Tanzania gateway for local testing).
 * Real providers (Selcom, Pesapal, mobile money / M-Pesa, Tigo Pesa, Airtel Money)
 * can be added in ./paymentProviders without touching controllers.
 */

const providers = {
  sandbox: require('../services/paymentProviders/sandbox'),
  selcom: require('../services/paymentProviders/placeholder'),
  pesapal: require('../services/paymentProviders/placeholder'),
  mobilemoney: require('../services/paymentProviders/placeholder'),
};

const getProvider = () => providers[env.paymentProvider] || providers.sandbox;

const createPayment = async ({ orderId, amount, method, customer }) => {
  const provider = getProvider();

  const providerRequest = await provider.createPayment({
    amount,
    method,
    customer,
    callbackUrl: env.paymentCallbackUrl,
  });

  const paymentReference = providerRequest.reference || generateReference('PAY');

  await query(
    `INSERT INTO payments (order_id, payment_reference, amount, payment_method, provider, status, metadata)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', $6::jsonb)`,
    [
      orderId,
      paymentReference,
      amount,
      method,
      env.paymentProvider,
      JSON.stringify({ checkoutUrl: providerRequest.checkoutUrl || null }),
    ]
  );

  return {
    paymentReference,
    checkoutUrl: providerRequest.checkoutUrl || null,
    instructions: providerRequest.instructions || null,
    provider: env.paymentProvider,
  };
};

const verifyPayment = async (paymentReference) => {
  const provider = getProvider();

  const { rows } = await query('SELECT * FROM payments WHERE payment_reference = $1', [
    paymentReference,
  ]);
  if (!rows[0]) {
    const error = new Error('Payment reference not found');
    error.statusCode = 404;
    throw error;
  }

  const payment = rows[0];
  if (payment.status === 'COMPLETED') {
    return { status: 'COMPLETED', orderId: payment.order_id, payment };
  }

  const providerResult = await provider.verifyPayment(paymentReference);

  if (providerResult.status === 'COMPLETED') {
    await completePayment(payment.order_id, providerResult.transactionReference);
  } else if (providerResult.status === 'FAILED') {
    await query('UPDATE payments SET status = $1 WHERE payment_reference = $2', [
      'FAILED',
      paymentReference,
    ]);
    await query("UPDATE orders SET payment_status = 'FAILED' WHERE id = $1", [
      payment.order_id,
    ]);
  }

  const { rows: updated } = await query(
    'SELECT * FROM payments WHERE payment_reference = $1',
    [paymentReference]
  );
  return { status: updated[0].status, orderId: payment.order_id, payment: updated[0] };
};

/**
 * Marks a payment + order as PAID exactly once, then permanently
 * reduces stock and sends the confirmation email.
 */
const completePayment = async (orderId, transactionReference) => {
  await transaction(async (client) => {
    const { rows: paymentRows } = await client.query(
      "SELECT * FROM payments WHERE order_id = $1 AND status = 'PENDING' FOR UPDATE",
      [orderId]
    );
    if (paymentRows.length === 0) return;

    await client.query(
      `UPDATE payments
       SET status = 'COMPLETED', transaction_reference = $2, completed_at = now()
       WHERE id = $1`,
      [paymentRows[0].id, transactionReference || null]
    );

    await client.query(
      "UPDATE orders SET payment_status = 'PAID', updated_at = now() WHERE id = $1",
      [orderId]
    );

    const { rows: items } = await client.query('SELECT * FROM order_items WHERE order_id = $1', [
      orderId,
    ]);

    for (const item of items) {
      await client.query(
        `UPDATE product_sizes
         SET stock_quantity = GREATEST(stock_quantity - $3, 0)
         WHERE product_id = $1 AND size = $2`,
        [item.product_id, item.size, item.quantity]
      );
    }
  });

  const { rows: orders } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (orders[0]) {
    const { rows: orderItems } = await query(
      'SELECT product_name, size, quantity, price FROM order_items WHERE order_id = $1',
      [orderId]
    );
    emailService.sendOrderConfirmation({ order: orders[0], items: orderItems }).catch(() => {});
    emailService.sendPaymentConfirmed({ order: orders[0], items: orderItems }).catch(() => {});
  }
};

module.exports = { createPayment, verifyPayment, completePayment, getProvider };
