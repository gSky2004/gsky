const { query, transaction } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, paginate } = require('../utils/helpers');

const productSelect = `
  SELECT p.*,
         c.name AS category_name,
         COALESCE(SUM(ps.stock_quantity), 0)::int AS total_stock,
         COALESCE(
           (SELECT ARRAY_AGG(pi.image_url) FROM product_images pi WHERE pi.product_id = p.id),
           ARRAY[]::text[]
         ) AS images,
         COALESCE(
           (SELECT json_agg(json_build_object('size', ps.size, 'stock_quantity', ps.stock_quantity) ORDER BY ps.size::int)
            FROM product_sizes ps WHERE ps.product_id = p.id),
           '[]'::json
         ) AS sizes
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_sizes ps ON ps.product_id = p.id
`;

const groupProducts = (rows) => {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id)) {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        price: r.price,
        main_image: r.main_image,
        is_featured: r.is_featured,
        is_new: r.is_new,
        is_best_seller: r.is_best_seller,
        category_id: r.category_id,
        category_name: r.category_name,
        created_at: r.created_at,
        updated_at: r.updated_at,
        images: r.images,
        sizes: r.sizes,
        total_stock: r.total_stock,
        avg_rating: r.avg_rating || null,
        review_count: r.review_count || 0,
      });
    }
  }
  return Array.from(map.values());
};

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const { q, category, size, sort, featured, best_seller, is_new } = req.query;

  const where = ['1=1'];
  const params = [];
  const add = (clause, value) => {
    params.push(value);
    where.push(clause.replace('?', `$${params.length}`));
  };

  if (q) add('p.name ILIKE ?', `%${q}%`);
  if (category) add('p.category_id = ?', category);
  if (size) add(`EXISTS (SELECT 1 FROM product_sizes ps WHERE ps.product_id = p.id AND ps.size = ? AND ps.stock_quantity > 0)`, size);
  if (featured === 'true') add('p.is_featured = ?', true);
  if (best_seller === 'true') add('p.is_best_seller = ?', true);
  if (is_new === 'true') add('p.is_new = ?', true);

  const orderMap = {
    newest: 'p.created_at DESC',
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    best_sellers: 'p.is_best_seller DESC, p.created_at DESC',
    name: 'p.name ASC',
  };
  const orderBy = orderMap[sort] || 'p.created_at DESC';

  const baseQuery = `${productSelect}
    LEFT JOIN (
      SELECT r.product_id, AVG(r.rating)::numeric(3,2) AS avg_rating, COUNT(*)::int AS review_count
      FROM reviews r GROUP BY r.product_id
    ) rv ON rv.product_id = p.id
    WHERE ${where.join(' AND ')} GROUP BY p.id, c.name, rv.avg_rating, rv.review_count`;

  const [{ rows: countRows }, { rows }] = await Promise.all([
    query(
      `SELECT COUNT(DISTINCT p.id)::int AS total FROM products p
       WHERE ${where.join(' AND ')}`,
      params
    ),
    query(`${baseQuery} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [
      ...params,
      limit,
      offset,
    ]),
  ]);

  res.json({
    products: groupProducts(rows),
    total: countRows[0].total,
    page,
    limit,
    totalPages: Math.ceil(countRows[0].total / limit),
  });
});

const getBySlug = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `${productSelect}
     LEFT JOIN (
       SELECT r.product_id, AVG(r.rating)::numeric(3,2) AS avg_rating, COUNT(*)::int AS review_count
       FROM reviews r GROUP BY r.product_id
     ) rv ON rv.product_id = p.id
     WHERE p.slug = $1 GROUP BY p.id, c.name, rv.avg_rating, rv.review_count`,
    [req.params.slug]
  );
  if (!rows[0]) throw new ApiError(404, 'Product not found');
  res.json({ product: groupProducts(rows)[0] });
});

const getById = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `${productSelect}
     LEFT JOIN (
       SELECT r.product_id, AVG(r.rating)::numeric(3,2) AS avg_rating, COUNT(*)::int AS review_count
       FROM reviews r GROUP BY r.product_id
     ) rv ON rv.product_id = p.id
     WHERE p.id = $1 GROUP BY p.id, c.name, rv.avg_rating, rv.review_count`,
    [req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Product not found');
  res.json({ product: groupProducts(rows)[0] });
});

const parseBool = (v) => v === true || v === 'true';

const normalizeSizes = (sizes) => {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map((s) => {
      if (typeof s === 'string') {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      }
      return s;
    })
    .filter(Boolean);
};

const create = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category_id,
    sizes,
    is_featured,
    is_new,
    is_best_seller,
  } = req.body;

  const mainImage =
    (req.files && req.files[0] && `/uploads/${req.files[0].filename}`) ||
    req.body.main_image ||
    null;
  const gallery = req.files
    ? req.files.map((f) => `/uploads/${f.filename}`)
    : req.body.gallery || [];

  const slug = await uniqueSlug(name);
  const parsedSizes = normalizeSizes(sizes);

  const product = await transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO products (name, slug, description, price, category_id, main_image, is_featured, is_new, is_best_seller)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        name,
        slug,
        description || '',
        price,
        category_id || null,
        mainImage,
        parseBool(is_featured),
        parseBool(is_new),
        parseBool(is_best_seller),
      ]
    );

    for (const img of gallery.filter(Boolean)) {
      await client.query('INSERT INTO product_images (product_id, image_url) VALUES ($1,$2)', [
        rows[0].id,
        img,
      ]);
    }

    if (parsedSizes.length) {
      for (const s of parsedSizes) {
        if (s.size && Number(s.stock_quantity) > 0) {
          await client.query(
            'INSERT INTO product_sizes (product_id, size, stock_quantity) VALUES ($1,$2,$3)',
            [rows[0].id, String(s.size), Number(s.stock_quantity)]
          );
        }
      }
    }
    return rows[0];
  });

  res.status(201).json({ product });
});

const uniqueSlug = async (name) => {
  const base = slugify(name) || 'product';
  let slug = base;
  let i = 1;
  for (;;) {
    const { rows } = await query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (!rows[0]) return slug;
    slug = `${base}-${i++}`;
  }
};

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
  if (!existing.rows[0]) throw new ApiError(404, 'Product not found');

  const {
    name,
    description,
    price,
    category_id,
    sizes,
    remove_images,
    is_featured,
    is_new,
    is_best_seller,
  } = req.body;

  const newImages = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
  const parsedSizes = normalizeSizes(sizes);

  const product = await transaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE products SET
         name = $1, description = $2, price = $3, category_id = $4,
         is_featured = $5, is_new = $6, is_best_seller = $7, updated_at = now()
       WHERE id = $8 RETURNING *`,
      [
        name,
        description,
        price,
        category_id || null,
        parseBool(is_featured),
        parseBool(is_new),
        parseBool(is_best_seller),
        id,
      ]
    );

    if (newImages.length) {
      for (const url of newImages) {
        await client.query('INSERT INTO product_images (product_id, image_url) VALUES ($1,$2)', [
          id,
          url,
        ]);
      }
      if (!rows[0].main_image) {
        await client.query('UPDATE products SET main_image = $1 WHERE id = $2', [
          newImages[0],
          id,
        ]);
      }
    }

    if (Array.isArray(remove_images)) {
      for (const url of remove_images) {
        await client.query('DELETE FROM product_images WHERE product_id = $1 AND image_url = $2', [
          id,
          url,
        ]);
      }
    }

    if (parsedSizes.length) {
      await client.query('DELETE FROM product_sizes WHERE product_id = $1', [id]);
      for (const s of parsedSizes) {
        if (s.size) {
          await client.query(
            `INSERT INTO product_sizes (product_id, size, stock_quantity)
             VALUES ($1,$2,$3)
             ON CONFLICT (product_id, size)
             DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity`,
            [id, String(s.size), Number(s.stock_quantity) || 0]
          );
        }
      }
    }
    return rows[0];
  });

  res.json({ product });
});

const remove = asyncHandler(async (req, res) => {
  const { rows } = await query('DELETE FROM products WHERE id = $1 RETURNING id', [
    req.params.id,
  ]);
  if (!rows[0]) throw new ApiError(404, 'Product not found');
  res.json({ message: 'Product deleted' });
});

module.exports = { list, getBySlug, getById, create, update, remove };
