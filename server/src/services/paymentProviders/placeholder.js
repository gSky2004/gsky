const { generateReference } = require('../../utils/helpers');

/**
 * Placeholder provider for real Tanzania gateways (Selcom, Pesapal, mobile money).
 * Configure credentials in .env and implement createPayment/verifyPayment/handleWebhook
 * against the provider's API — no other part of the app needs to change.
 */

const missing = () => {
  const error = new Error(
    'This payment provider is not connected yet. Set PAYMENT_PROVIDER and provider credentials in server/.env.'
  );
  error.statusCode = 501;
  throw error;
};

const createPayment = async () => {
  missing();
  return { reference: generateReference('PAY') };
};

const verifyPayment = async () => {
  missing();
  return { status: 'PENDING' };
};

const handleWebhook = async () => {
  missing();
  return { reference: null, status: 'PENDING' };
};

module.exports = { createPayment, verifyPayment, handleWebhook };
