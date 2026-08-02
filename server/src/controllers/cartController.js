const { query } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getCart = async (userId) => {
  const { rows } = await query(
    `SELECT
       ci.id AS cart_item_id, ci.size, ci.quantity, ci.price,
       p.id AS product_id, p.name AS product_name, p.slug, p.main_image, p.description
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     WHERE c.user_id = $1
     ORDER BY ci.created_at DESC`,
    [userId]
  );

  const items = rows.map((r) => ({
    id: r.cart_item_id,
    product: {
      id: r.product_id,
      name: r.product_name,
      slug: r.slug,
      main_image: r.main_image,
    },
    size: r.size,
    quantity: r.quantity,
    price: Number(r.price),
  }));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items, subtotal };
};

const show = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  res.json(cart);
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, size, quantity } = req.body;
  const qty = Number(quantity) || 1;

  const { rows: product } = await query('SELECT id, name, price FROM products WHERE id = $1', [
    productId,
  ]);
  if (!product[0]) throw new ApiError(404, 'Product not found');

  const { rows: stock } = await query(
    'SELECT stock_quantity FROM product_sizes WHERE product_id = $1 AND size = $2',
    [productId, String(size)]
  );
  const available = stock[0] ? stock[0].stock_quantity : 0;
  if (available <= 0) throw new ApiError(400, 'Selected size is out of stock');

  const { rows: cartRows } = await query('SELECT id FROM carts WHERE user_id = $1', [req.user.id]);
  if (!cartRows[0]) throw new ApiError(404, 'Cart not found');
  const cartId = cartRows[0].id;

  const { rows: existing } = await query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND size = $3',
    [cartId, productId, String(size)]
  );

  if (existing[0]) {
    const newQty = existing[0].quantity + qty;
    if (newQty > available) {
      throw new ApiError(400, `Only ${available} unit(s) of size ${size} in stock`);
    }
    await query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [newQty, existing[0].id]);
  } else {
    if (qty > available) {
      throw new ApiError(400, `Only ${available} unit(s) of size ${size} in stock`);
    }
    await query(
      `INSERT INTO cart_items (cart_id, product_id, size, quantity, price)
       VALUES ($1,$2,$3,$4,$5)`,
      [cartId, productId, String(size), qty, product[0].price]
    );
  }

  res.json(await getCart(req.user.id));
});

const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) throw new ApiError(422, 'Quantity must be a positive integer');

  const { rows: item } = await query(
    `SELECT ci.* FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
     WHERE ci.id = $1 AND c.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!item[0]) throw new ApiError(404, 'Cart item not found');

  const { rows: stock } = await query(
    'SELECT stock_quantity FROM product_sizes WHERE product_id = $1 AND size = $2',
    [item[0].product_id, item[0].size]
  );
  const available = stock[0] ? stock[0].stock_quantity : 0;
  if (qty > available) {
    throw new ApiError(400, `Only ${available} unit(s) of size ${item[0].size} in stock`);
  }

  await query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [qty, item[0].id]);
  res.json(await getCart(req.user.id));
});

const removeItem = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `DELETE FROM cart_items ci USING carts c
     WHERE ci.id = $1 AND c.user_id = $2 AND ci.cart_id = c.id RETURNING ci.id`,
    [req.params.id, req.user.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Cart item not found');
  res.json(await getCart(req.user.id));
});

const clear = asyncHandler(async (req, res) => {
  await query(
    `DELETE FROM cart_items ci USING carts c WHERE c.user_id = $1 AND ci.cart_id = c.id`,
    [req.user.id]
  );
  res.json(await getCart(req.user.id));
});

module.exports = { show, addItem, updateItem, removeItem, clear };
