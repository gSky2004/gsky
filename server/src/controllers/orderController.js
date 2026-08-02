const { query, transaction } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateOrderNumber } = require('../utils/helpers');
const emailService = require('../services/emailService');
const paymentService = require('../services/paymentService');

const DEFAULT_DELIVERY_FEE = 5000;

const resolveDeliveryFee = async (zoneName) => {
  if (zoneName) {
    const { rows } = await query(
      'SELECT * FROM delivery_zones WHERE LOWER(name) = LOWER($1)',
      [zoneName]
    );
    if (rows[0]) return { fee: Number(rows[0].price), zone: rows[0].name };
  }

  const { rows: defaults } = await query(
    'SELECT * FROM delivery_zones WHERE is_default = TRUE LIMIT 1'
  );
  if (defaults[0]) {
    return { fee: Number(defaults[0].price), zone: defaults[0].name };
  }

  return { fee: DEFAULT_DELIVERY_FEE, zone: zoneName || 'Other / Upcountry' };
};

const create = asyncHandler(async (req, res) => {
  const { delivery, items, promoCode } = req.body;
  const d = delivery || {};

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(422, 'Your cart is empty');
  }

  const result = await transaction(async (client) => {
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { rows: product } = await client.query(
        'SELECT id, name, price, main_image FROM products WHERE id = $1',
        [item.productId]
      );
      if (!product[0]) throw new ApiError(400, `Product ${item.productId} not found`);

      const { rows: stock } = await client.query(
        'SELECT stock_quantity FROM product_sizes WHERE product_id = $1 AND size = $2 FOR UPDATE',
        [product[0].id, String(item.size)]
      );
      const available = stock[0] ? stock[0].stock_quantity : 0;
      const qty = Number(item.quantity);
      if (available <= 0) {
        throw new ApiError(
          400,
          `${product[0].name} size ${item.size} is out of stock`
        );
      }
      if (qty > available) {
        throw new ApiError(
          400,
          `Only ${available} unit(s) of ${product[0].name} size ${item.size} in stock`
        );
      }

      const lineTotal = Number(product[0].price) * qty;
      subtotal += lineTotal;
      orderItems.push({
        product_id: product[0].id,
        product_name: product[0].name,
        image_url: product[0].main_image,
        size: String(item.size),
        quantity: qty,
        price: Number(product[0].price),
      });
    }

    let discount = 0;
    let promoCodeUsed = null;
    if (promoCode) {
      const code = String(promoCode).trim().toUpperCase();
      const { rows: promo } = await client.query(
        `SELECT * FROM promo_codes WHERE UPPER(code) = $1 AND active = TRUE
           AND (expires_at IS NULL OR expires_at > now())
           AND (max_uses = 0 OR used_count < max_uses) FOR UPDATE`,
        [code]
      );
      if (!promo[0]) throw new ApiError(400, 'Invalid or expired promo code');
      const p = promo[0];
      if (subtotal < Number(p.min_order)) {
        throw new ApiError(400, `Promo requires a minimum order of TZS ${Number(p.min_order).toLocaleString('en-US')}`);
      }
      discount =
        p.discount_type === 'percent'
          ? Math.min(Number(p.value) / 100, 1) * subtotal
          : Number(p.value);
      discount = Math.min(discount, subtotal);
      promoCodeUsed = p.code;
      await client.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1', [p.id]);
    }

    const orderNumber = generateOrderNumber();
    const zoneLookup = await resolveDeliveryFee(d.zone || d.area);
    const fee = zoneLookup.fee;
    const total = Math.max(0, subtotal - discount) + fee;

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
        (user_id, order_number, subtotal, discount_amount, delivery_fee, total_amount,
         full_name, phone, email, city, area, street, delivery_zone, delivery_notes, promo_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        req.user.id,
        orderNumber,
        subtotal,
        discount,
        fee,
        total,
        d.full_name,
        d.phone,
        d.email,
        d.city,
        d.area || '',
        d.street || '',
        zoneLookup.zone,
        d.delivery_notes || '',
        promoCodeUsed,
      ]
    );

    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, image_url, size, quantity, price)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          orderRows[0].id,
          oi.product_id,
          oi.product_name,
          oi.image_url,
          oi.size,
          oi.quantity,
          oi.price,
        ]
      );
    }

    await client.query(
      `DELETE FROM cart_items ci USING carts c
       WHERE c.user_id = $1 AND ci.cart_id = c.id`,
      [req.user.id]
    );

    const { rows: itemsRows } = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderRows[0].id]
    );

    return { order: orderRows[0], items: itemsRows };
  });

  emailService.sendOrderConfirmation({ order: result.order, items: result.items }).catch(() => {});
  emailService.sendAdminNewOrder({ order: result.order, items: result.items }).catch(() => {});

  res.status(201).json({ order: result.order, items: result.items });
});

const mine = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ orders: rows });
});

const track = asyncHandler(async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();

  if (!email || !orderNumber) {
    throw new ApiError(422, 'Email and Order ID are required to track your order');
  }

  const { rows } = await query(
    `SELECT * FROM orders WHERE LOWER(email) = $1 AND UPPER(order_number) = $2`,
    [email, orderNumber]
  );
  if (!rows[0]) {
    throw new ApiError(404, 'No order found. Check your billing email and Order ID.');
  }

  const order = rows[0];
  const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [
    order.id,
  ]);

  res.json({
    order: {
      id: order.id,
      order_number: order.order_number,
      order_status: order.order_status,
      payment_status: order.payment_status,
      full_name: order.full_name,
      phone: order.phone,
      email: order.email,
      city: order.city,
      area: order.area,
      street: order.street,
      delivery_zone: order.delivery_zone,
      delivery_notes: order.delivery_notes,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total_amount: order.total_amount,
      client_confirmed_at: order.client_confirmed_at,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items,
    },
  });
});

const confirmDelivery = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  const order = rows[0];
  if (!order) throw new ApiError(404, 'Order not found');
  if (req.user.role !== 'ADMIN' && order.user_id !== req.user.id) {
    throw new ApiError(403, 'You cannot confirm this order');
  }
  if (order.order_status !== 'DELIVERED') {
    throw new ApiError(422, 'You can only confirm delivery after the order is marked as DELIVERED');
  }
  if (order.client_confirmed_at) {
    throw new ApiError(409, 'Delivery already confirmed');
  }

  const { rows: updated } = await query(
    `UPDATE orders SET client_confirmed_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
    [order.id]
  );

  emailService.sendDeliveryConfirmation({ order: updated[0] }).catch(() => {});

  res.json({ order: updated[0], message: 'Delivery confirmed. Thank you!' });
});

const getById = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Order not found');

  const order = rows[0];
  if (req.user.role !== 'ADMIN' && order.user_id !== req.user.id) {
    throw new ApiError(403, 'You cannot view this order');
  }

  const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [
    order.id,
  ]);
  const { rows: payments } = await query(
    'SELECT id, payment_reference, amount, payment_method, provider, status, created_at FROM payments WHERE order_id = $1',
    [order.id]
  );

  res.json({ order: { ...order, items, payments } });
});

module.exports = { create, mine, track, confirmDelivery, getById };
