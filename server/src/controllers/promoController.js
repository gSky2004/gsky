const { query } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const list = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM promo_codes ORDER BY created_at DESC');
  res.json({ promos: rows });
});

const getValid = asyncHandler(async (req, res) => {
  const code = normalizeCode(req.query.code);
  if (!code) throw new ApiError(422, 'Promo code is required');
  const { rows } = await query(
    `SELECT * FROM promo_codes WHERE UPPER(code) = $1 AND active = TRUE
       AND (expires_at IS NULL OR expires_at > now())
       AND (max_uses = 0 OR used_count < max_uses)`,
    [code]
  );
  if (!rows[0]) throw new ApiError(404, 'Invalid or expired promo code');
  const p = rows[0];
  res.json({
    promo: {
      id: p.id,
      code: p.code,
      discount_type: p.discount_type,
      value: Number(p.value),
      min_order: Number(p.min_order),
    },
  });
});

const create = asyncHandler(async (req, res) => {
  const { code, discount_type, value, min_order, max_uses, active, expires_at } = req.body;
  if (!code || !discount_type || value == null) {
    throw new ApiError(422, 'Code, discount type and value are required');
  }
  const { rows } = await query(
    `INSERT INTO promo_codes (code, discount_type, value, min_order, max_uses, active, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [normalizeCode(code), discount_type, Number(value), Number(min_order || 0), Number(max_uses || 0), active !== false, expires_at || null]
  );
  res.status(201).json({ promo: rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { code, discount_type, value, min_order, max_uses, active, expires_at } = req.body;
  const { rows } = await query(
    `UPDATE promo_codes SET
       code = COALESCE($2, code),
       discount_type = COALESCE($3, discount_type),
       value = COALESCE($4, value),
       min_order = COALESCE($5, min_order),
       max_uses = COALESCE($6, max_uses),
       active = COALESCE($7, active),
       expires_at = COALESCE($8, expires_at)
     WHERE id = $1 RETURNING *`,
    [id, code ? normalizeCode(code) : null, discount_type || null, value != null ? Number(value) : null, min_order != null ? Number(min_order) : null, max_uses != null ? Number(max_uses) : null, active == null ? null : !!active, expires_at || null]
  );
  if (!rows[0]) throw new ApiError(404, 'Promo code not found');
  res.json({ promo: rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM promo_codes WHERE id = $1', [req.params.id]);
  res.json({ message: 'Promo code deleted' });
});

module.exports = { list, getValid, create, update, remove };
