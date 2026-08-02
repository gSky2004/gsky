const { query } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

const create = asyncHandler(async (req, res) => {
  const { orderId, method } = req.body;

  const { rows } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = rows[0];
  if (!order) throw new ApiError(404, 'Order not found');
  if (req.user.role !== 'ADMIN' && order.user_id !== req.user.id) {
    throw new ApiError(403, 'You cannot pay for this order');
  }
  if (order.payment_status === 'PAID') {
    throw new ApiError(400, 'Order is already paid');
  }
  if (order.order_status === 'CANCELLED') {
    throw new ApiError(400, 'This order has been cancelled');
  }

  const payment = await paymentService.createPayment({
    orderId: order.id,
    amount: order.total_amount,
    method,
    customer: {
      name: order.full_name,
      email: order.email,
      phone: order.phone,
    },
  });

  res.status(201).json(payment);
});

const verify = asyncHandler(async (req, res) => {
  const { paymentReference } = req.body;
  if (!paymentReference) throw new ApiError(422, 'paymentReference is required');

  const result = await paymentService.verifyPayment(paymentReference);
  const orderId = result.orderId;

  let order = null;
  if (orderId) {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    order = rows[0] || null;
  }

  res.json({ status: result.status, order });
});

module.exports = { create, verify };
