const { generateReference } = require('../../utils/helpers');
const env = require('../../config/env');
const { query } = require('../../db/pool');

/**
 * Sandbox payment provider.
 * Simulates the full gateway round-trip on the server so the
 * CLIENT → CHECKOUT → PAYMENT → VERIFY → PAID → STOCK → EMAIL
 * flow can be tested end-to-end without a real Tanzania gateway.
 *
 * If PAYMENT_SANDBOX_AUTO_CONFIRM is true the simulated gateway
 * "confirms" the payment shortly after creation (verifyPayment then
 * returns COMPLETED, exactly like a real async webhook would).
 */

const settleDelayMs = 2500;
const autoConfirm = env.paymentSandboxAutoConfirm;

const pendingByReference = new Map();

const createPayment = async ({ amount, method, customer, callbackUrl }) => {
  const reference = generateReference('SANDBOX');
  pendingByReference.set(reference, {
    status: 'PENDING',
    createdAt: Date.now(),
  });
  return {
    reference,
    checkoutUrl: null,
    instructions: {
      title: 'Sandbox payment (test mode)',
      body: `This is a simulated payment of TZS ${Number(amount).toLocaleString()} via ${method}.`,
      note: 'No real money is charged. The payment is confirmed automatically for testing.',
    },
  };
};

const verifyPayment = async (reference) => {
  const pending = pendingByReference.get(reference);
  if (!pending) return { status: 'FAILED' };

  if (autoConfirm && Date.now() - pending.createdAt >= settleDelayMs) {
    pending.status = 'COMPLETED';
  }

  return {
    status: pending.status,
    transactionReference: pending.status === 'COMPLETED' ? `TXN-${reference}` : undefined,
  };
};

const handleWebhook = async () => ({ reference: null, status: 'PENDING' });

module.exports = { createPayment, verifyPayment, handleWebhook };
