const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const env = require('./config/env');
const { notFound, errorHandler } = require('./utils/ApiError');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const contactRoutes = require('./routes/contactRoutes');
const promoRoutes = require('./routes/promoRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
const allowedOrigins = new Set(env.clientUrls);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

app.use('/uploads', express.static(path.resolve(__dirname, '../', env.uploadDir)));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/reviews', apiLimiter, reviewRoutes);
app.use('/api/newsletter', apiLimiter, newsletterRoutes);
app.use('/api/delivery-zones', apiLimiter, deliveryRoutes);
app.use('/api/contact', apiLimiter, contactRoutes);
app.use('/api/promos', apiLimiter, promoRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

const clientDist = path.resolve(__dirname, '../../client/dist');
if (env.nodeEnv === 'production' && require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
