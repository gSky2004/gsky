const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const reviewController = require('../controllers/reviewController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reviewValidator } = require('../validators/validators');

const router = express.Router();

const uploadDir = path.resolve(__dirname, '../../', env.uploadDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `rev-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (/image\/(jpeg|png|webp|avif|gif)/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/product/:productId', reviewController.listForProduct);

router.use(authenticateUser, authorizeRole('CLIENT', 'ADMIN'));
router.post('/product/:productId', upload.single('image'), reviewValidator, validate, reviewController.create);
router.delete('/:id', reviewController.remove);

module.exports = router;
