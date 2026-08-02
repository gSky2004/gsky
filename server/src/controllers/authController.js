const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query, transaction } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const publicUser = (row) => ({
  id: row.id,
  full_name: row.full_name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  created_at: row.created_at,
});

const register = asyncHandler(async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'CLIENT')
       RETURNING id, full_name, email, phone, role, created_at`,
      [full_name, email, phone, passwordHash]
    );
    await client.query('INSERT INTO carts (user_id) VALUES ($1)', [rows[0].id]);
    return rows[0];
  });

  emailService.sendWelcome({ to: user.email, name: user.full_name, email: user.email }).catch(() => {});

  res.status(201).json({
    user: publicUser(user),
    message: 'Account created successfully. Please login.',
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

const me = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json({ user: publicUser(rows[0]) });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone } = req.body;
  const { rows } = await query(
    `UPDATE users SET full_name = $1, phone = $2, updated_at = now()
     WHERE id = $3 RETURNING id, full_name, email, phone, role, created_at`,
    [full_name, phone, req.user.id]
  );

  res.json({ user: publicUser(rows[0]) });
});

module.exports = { register, login, me, logout, updateProfile };
