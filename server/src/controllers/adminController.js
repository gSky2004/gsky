const { query } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');

const stats = asyncHandler(async (req, res) => {
  const [
    { rows: sales },
    { rows: orders },
    { rows: customers },
    { rows: subscribers },
    { rows: pending },
    { rows: lowStock },
  ] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(total_amount),0)::numeric(12,2) AS total_sales
       FROM orders WHERE payment_status = 'PAID'`
    ),
    query('SELECT COUNT(*)::int AS total FROM orders'),
    query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'CLIENT'"),
    query(
      'SELECT COUNT(*)::int AS total FROM newsletter_subscribers WHERE subscribed = TRUE'
    ),
    query(
      "SELECT COUNT(*)::int AS total FROM orders WHERE order_status = 'PENDING'"
    ),
    query(
      `SELECT COUNT(*)::int AS total FROM product_sizes WHERE stock_quantity <= 3`
    ),
  ]);

  const { rows: pendingOrders } = await query(
    "SELECT * FROM orders WHERE order_status = 'PENDING' ORDER BY created_at DESC LIMIT 5"
  );

  const { rows: bestSellers } = await query(
    `SELECT p.id, p.name, p.main_image, p.price,
            COALESCE(SUM(oi.quantity),0)::int AS sold
     FROM products p
     LEFT JOIN order_items oi
       ON oi.product_id = p.id
     LEFT JOIN orders o
       ON o.id = oi.order_id AND o.payment_status = 'PAID'
     WHERE o.id IS NOT NULL OR oi.product_id IS NULL
     GROUP BY p.id
     ORDER BY sold DESC
     LIMIT 5`
  );

  const { rows: lowStockProducts } = await query(
    `SELECT p.id, p.name, p.main_image,
            COALESCE(SUM(ps.stock_quantity),0)::int AS total_stock
     FROM products p
     LEFT JOIN product_sizes ps ON ps.product_id = p.id
     GROUP BY p.id
     HAVING COALESCE(SUM(ps.stock_quantity),0) <= 3
     ORDER BY total_stock ASC
     LIMIT 5`
  );

  const { rows: categoryRevenue } = await query(
    `SELECT c.name AS category,
            COALESCE(SUM(oi.quantity * oi.price),0)::numeric(12,2) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id AND o.payment_status = 'PAID'
     JOIN products p ON p.id = oi.product_id
     JOIN categories c ON c.id = p.category_id
     GROUP BY c.name
     ORDER BY revenue DESC`
  );

  const { rows: ordersByStatus } = await query(
    `SELECT order_status AS status, COUNT(*)::int AS count
     FROM orders
     GROUP BY order_status
     ORDER BY count DESC`
  );

  res.json({
    stats: {
      totalSales: Number(sales[0].total_sales),
      totalOrders: orders[0].total,
      totalCustomers: customers[0].total,
      newsletterSubscribers: subscribers[0].total,
      pendingOrders: pending[0].total,
      lowStock: lowStock[0].total,
    },
    pendingOrders,
    bestSellers,
    lowStockProducts,
    categoryRevenue,
    ordersByStatus,
  });
});

const salesSeries = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total_amount),0)::numeric(12,2) AS revenue
     FROM orders
     WHERE payment_status = 'PAID'
     GROUP BY month
     ORDER BY month DESC
     LIMIT 6`
  );
  res.json({ series: rows.reverse() });
});

const listOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '1=1';
  if (status) {
    params.push(status);
    where = `order_status = $1`;
  }
  const { rows } = await query(
    `SELECT o.*, u.email AS user_email, u.phone AS user_phone
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     WHERE ${where} ORDER BY o.created_at DESC LIMIT 100`,
    params
  );
  res.json({ orders: rows });
});

const getOrder = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Order not found');

  const { rows: items } = await query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [rows[0].id]
  );
  const { rows: payments } = await query(
    'SELECT * FROM payments WHERE order_id = $1',
    [rows[0].id]
  );
  res.json({ order: { ...rows[0], items, payments } });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
  if (!valid.includes(status)) throw new ApiError(422, 'Invalid order status');

  const { rows } = await query(
    `UPDATE orders SET order_status = $1, updated_at = now()
     WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Order not found');

  if (status === 'CANCELLED') {
    await query("UPDATE orders SET payment_status = 'REFUNDED' WHERE id = $1 AND payment_status = 'PAID'", [
      rows[0].id,
    ]);
  }

  emailService.sendOrderStatusUpdate({ order: rows[0] }).catch(() => {});
  res.json({ order: rows[0] });
});

const listCustomers = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.created_at,
            COUNT(DISTINCT o.id)::int AS order_count,
            COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total_amount END),0)::numeric(12,2)
              AS total_spent
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  res.json({ customers: rows });
});

const listNewsletter = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, email, phone, shoe_size, subscribed, subscribed_at, unsubscribed_at
     FROM newsletter_subscribers ORDER BY subscribed_at DESC`
  );
  const { rows: campaigns } = await query(
    `SELECT subject, body, recipient_count, sent_at FROM email_campaigns ORDER BY sent_at DESC LIMIT 20`
  );
  res.json({ subscribers: rows, campaigns });
});

const listReviews = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at,
            u.full_name, u.email AS user_email,
            p.name AS product_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC
     LIMIT 200`
  );
  res.json({ reviews: rows });
});

const sendTestEmail = asyncHandler(async (req, res) => {
  const { to } = req.body;
  const address = to || req.user.email;
  if (!address) throw new ApiError(422, 'No recipient email provided');
  const result = await emailService.sendTest({ to: address });
  res.json({ message: `Test email sent to ${address}`, ...result });
});

module.exports = {
  stats,
  salesSeries,
  listOrders,
  getOrder,
  updateStatus,
  listCustomers,
  listNewsletter,
  listReviews,
  sendTestEmail,
};
