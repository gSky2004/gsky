const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { pool } = require('./pool');
const { slugify } = require('../utils/helpers');

const uploadDir = path.resolve(__dirname, '../../', env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const img = (name) => `/uploads/${name}.webp`;

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const adminHash = await bcrypt.hash(env.adminPassword, 12);
    const { rows: admin } = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,'ADMIN')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [env.adminName, env.adminEmail, env.adminPhone, adminHash]
    );

    const demoHash = await bcrypt.hash('Client@123', 12);
    const { rows: clientRow } = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ('Nia Joseph','nia@gsky.co.tz','0712345678',$1,'CLIENT')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [demoHash]
    );
    if (clientRow[0]) {
      await client.query('INSERT INTO carts (user_id) VALUES ($1)', [clientRow[0].id]);
    }

    console.log(admin[0] ? `[seed] Admin created: ${env.adminEmail}` : '[seed] Admin already exists');
    console.log(clientRow[0] ? '[seed] Demo client created: nia@gsky.co.tz / Client@123' : '[seed] Demo client exists');

    const categories = [
      { name: 'Football', description: 'Boots, cleats and turf shoes for match day.' },
      { name: 'Running', description: 'Built for speed and long-distance comfort.' },
      { name: 'Basketball', description: 'High-top support for the court.' },
      { name: 'Training', description: 'Gym-ready shoes for workouts.' },
      { name: 'Lifestyle', description: 'Everyday sneakers with street style.' },
    ];

    const catIds = {};
    for (const c of categories) {
      const { rows } = await client.query(
        `INSERT INTO categories (name, description) VALUES ($1,$2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [c.name, c.description]
      );
      catIds[c.name] = rows[0].id;
    }

    const products = [
      { name: 'Gsky Predator FG', cat: 'Football', price: 98000, featured: true, new: true, best: true, img: '02', desc: 'Firm-ground football boot with a strike-zone upper for deadly accuracy and a lightweight soleplate for explosive speed.' },
      { name: 'Gsky Strike Elite', cat: 'Football', price: 112000, featured: true, new: true, best: true, img: '03', desc: 'Elite match-day boot. Engineered touch, aggressive traction and lockdown comfort for serious players.' },
      { name: 'Gsky Phantom FG', cat: 'Football', price: 89000, featured: true, new: true, best: false, img: '04', desc: 'Control-focused football boot with a soft textured upper that grips the ball for passing and dribbling.' },
      { name: 'Gsky Matchday TF', cat: 'Football', price: 76000, featured: true, new: true, best: true, img: '05', desc: 'Turf and artificial-grass shoe with rubber studs, padded collar and a durable grippy outsole.' },
      { name: 'Gsky Turf Pro', cat: 'Football', price: 82000, featured: false, new: true, best: false, img: '06', desc: 'Hard-ground and astroturf boot built to last. Supportive fit with great first touch on dry pitches.' },
      { name: 'Gsky Court Indoor', cat: 'Football', price: 69000, featured: false, new: true, best: false, img: '07', desc: 'Indoor futsal shoe with a non-marking gum sole and a responsive cushioned midsole for quick direction changes.' },
      { name: 'Gsky Runner Pro', cat: 'Running', price: 85000, featured: true, new: false, best: true, img: 'run', desc: 'Lightweight racing shoe with responsive foam and breathable mesh upper. Perfect for daily runs and 10k races.' },
      { name: 'Gsky Speed 500', cat: 'Running', price: 72000, featured: false, new: true, best: false, img: '11', desc: 'A fast, springy everyday trainer with a supportive midsole and durable outsole for the streets of Dar.' },
      { name: 'Gsky Court King', cat: 'Basketball', price: 98000, featured: true, new: false, best: true, img: '08', desc: 'High-top basketball shoe with ankle support, cushioning and a grippy rubber outsole for indoor courts.' },
      { name: 'Gsky Stomp ST', cat: 'Basketball', price: 88000, featured: false, new: true, best: false, img: '09', desc: 'Aggressive traction and lockdown fit for explosive play. Built to last a full season.' },
      { name: 'Gsky Power Gym', cat: 'Training', price: 70000, featured: false, new: true, best: false, img: 'flex', desc: 'Flat stable base for lifting and cross-training, with a reinforced toe and breathable knit.' },
      { name: 'Gsky Flex 4', cat: 'Training', price: 62000, featured: false, new: false, best: false, img: '10', desc: 'Flexible and lightweight for HIIT classes and short sprints. Great value for money.' },
      { name: 'Gsky Street Pro', cat: 'Lifestyle', price: 65000, featured: true, new: true, best: true, img: '12', desc: 'Clean, versatile sneaker that pairs with anything. Premium materials and all-day comfort.' },
      { name: 'Gsky Air Runner', cat: 'Lifestyle', price: 99000, featured: true, new: true, best: false, img: '13', desc: 'Retro-inspired sneaker with visible air cushioning and premium overlays. A street classic.' },
      { name: 'Gsky Combo Pack', cat: 'Lifestyle', price: 145000, featured: true, new: true, best: false, img: 'combo', desc: 'The Gsky combo special — two essential pairs for training and everyday wear at one great price.' },
      { name: 'Gsky Heritage Edition', cat: 'Lifestyle', price: 120000, featured: true, new: true, best: true, img: 'gsky-sport', desc: 'Our signature Gsky edition. Premium build, bold branding and a fit that stands out on and off the pitch.' },
    ];

    const deliveryZones = [
      { name: 'Ilala', price: 5000, is_default: false },
      { name: 'Kinondoni', price: 6000, is_default: false },
      { name: 'Ubungo', price: 7000, is_default: false },
      { name: 'Temeke', price: 8000, is_default: false },
      { name: 'Kigamboni', price: 10000, is_default: false },
      { name: 'Other / Upcountry', price: 15000, is_default: true },
    ];

    for (const z of deliveryZones) {
      await client.query(
        `INSERT INTO delivery_zones (name, price, is_default) VALUES ($1,$2,$3)
         ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, is_default = EXCLUDED.is_default`,
        [z.name, z.price, z.is_default]
      );
    }

    await client.query('DELETE FROM products');

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const slug = slugify(p.name);

      const sizes = [
        { size: '39', stock: 3 },
        { size: '40', stock: 6 },
        { size: '41', stock: 4 },
        { size: '42', stock: 5 },
        { size: '43', stock: 4 },
        { size: '44', stock: 2 },
      ];

      const gallery = [p.img, p.img].map(img);

      const { rows } = await client.query(
        `INSERT INTO products
           (category_id, name, slug, description, price, main_image, is_featured, is_new, is_best_seller)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [
          catIds[p.cat],
          p.name,
          slug,
          p.desc,
          p.price,
          img(p.img),
          p.featured,
          p.new,
          p.best,
        ]
      );

      for (const url of gallery) {
        await client.query('INSERT INTO product_images (product_id, image_url) VALUES ($1,$2)', [
          rows[0].id,
          url,
        ]);
      }

      for (const s of sizes) {
        await client.query(
          'INSERT INTO product_sizes (product_id, size, stock_quantity) VALUES ($1,$2,$3)',
          [rows[0].id, s.size, s.stock]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`[seed] Categories + ${products.length} products ready with real images.`);
    console.log(`[seed] ${deliveryZones.length} delivery zones ready (Ilala → Kigamboni + upcountry).`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed()
  .then(() => console.log('[seed] Done.'))
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  });
