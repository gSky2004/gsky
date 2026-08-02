const { query } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const listForProduct = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.id, r.rating, r.comment, r.image_url, r.created_at,
            u.full_name, u.id AS user_id
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [req.params.productId]
  );
  res.json({ reviews: rows });
});

const create = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (req.user.role !== 'ADMIN') {
    const { rows: purchased } = await query(
      `SELECT 1 FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1 AND oi.product_id = $2
         AND o.payment_status = 'PAID'
       LIMIT 1`,
      [req.user.id, productId]
    );
    if (!purchased[0]) {
      throw new ApiError(
        403,
        'You can only review products you have purchased'
      );
    }
  }

  const { rows } = await query(
    `INSERT INTO reviews (user_id, product_id, rating, comment, image_url)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment,
                   image_url = EXCLUDED.image_url, created_at = now()
     RETURNING id, rating, comment, image_url, created_at`,
    [req.user.id, productId, Number(rating), comment || '', imageUrl]
  );

  res.status(201).json({ review: rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const { rows: existing } = await query('SELECT id, user_id FROM reviews WHERE id = $1', [
    req.params.id,
  ]);
  if (!existing[0]) throw new ApiError(404, 'Review not found');

  const isOwner = existing[0].user_id === req.user.id;
  const isAdmin = req.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You cannot delete this review');
  }

  await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
  res.json({ message: 'Review deleted' });
});

module.exports = { listForProduct, create, remove };
