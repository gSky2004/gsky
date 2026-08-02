const { query } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const mine = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.name, p.slug, p.price, p.main_image, p.is_new, p.is_best_seller, p.is_featured
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json({ products: rows });
});

const add = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new ApiError(422, 'Product is required');
  await query(
    'INSERT INTO wishlists (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [req.user.id, productId]
  );
  res.status(201).json({ message: 'Added to wishlist' });
});

const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2', [
    req.user.id,
    req.params.productId,
  ]);
  res.json({ message: 'Removed from wishlist' });
});

module.exports = { mine, add, remove };
