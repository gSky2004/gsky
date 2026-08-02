const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

const setup = async () => {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('[db] Applying schema...');
  await pool.query(schema);
  console.log('[db] Schema ready.');
  await pool.end();
};

setup().catch((err) => {
  console.error('[db] Schema setup failed:', err.message);
  process.exit(1);
});
