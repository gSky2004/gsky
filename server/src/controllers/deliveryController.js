const { query } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM delivery_zones ORDER BY is_default DESC, price ASC, name ASC');
  res.json({ zones: rows });
});

const create = asyncHandler(async (req, res) => {
  const { name, price, is_default } = req.body;
  if (!name || !String(name).trim()) throw new ApiError(422, 'Zone name is required');

  const { rows } = await query(
    `INSERT INTO delivery_zones (name, price, is_default)
     VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, is_default = EXCLUDED.is_default, updated_at = now()
     RETURNING *`,
    [String(name).trim(), Number(price) || 0, !!is_default]
  );

  res.status(201).json({ zone: rows[0] });
});

const update = asyncHandler(async (req, res) => {
  const { name, price, is_default } = req.body;
  if (!name || !String(name).trim()) throw new ApiError(422, 'Zone name is required');

  const { rows } = await query(
    `UPDATE delivery_zones
     SET name = $1, price = $2, is_default = $3, updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [String(name).trim(), Number(price) || 0, !!is_default, req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Delivery zone not found');

  res.json({ zone: rows[0] });
});

const remove = asyncHandler(async (req, res) => {
  const { rows } = await query('DELETE FROM delivery_zones WHERE id = $1 RETURNING id', [
    req.params.id,
  ]);
  if (!rows[0]) throw new ApiError(404, 'Delivery zone not found');
  res.json({ message: 'Delivery zone deleted' });
});

module.exports = { list, create, update, remove };
