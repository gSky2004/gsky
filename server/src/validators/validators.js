const { body } = require('express-validator');

const productValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('sizes').custom((value) => {
    const list = Array.isArray(value) ? value : [value];
    for (const entry of list) {
      const parsed = typeof entry === 'string' ? JSON.parse(entry) : entry;
      if (!parsed || !parsed.size) throw new Error('Each size must include a size value');
      if (!Number.isInteger(Number(parsed.stock_quantity)) || Number(parsed.stock_quantity) < 0) {
        throw new Error('Stock must be a non-negative integer');
      }
    }
    return true;
  }),
];

const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
];

const cartItemValidator = [
  body('productId').isUUID().withMessage('Valid product ID required'),
  body('size').trim().notEmpty().withMessage('Size is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const orderValidator = [
  body('delivery.full_name').trim().notEmpty().withMessage('Full name is required'),
  body('delivery.phone').trim().notEmpty().withMessage('Phone is required'),
  body('delivery.email').isEmail().withMessage('Valid email is required'),
  body('delivery.city').trim().notEmpty().withMessage('City is required'),
  body('items').isArray({ min: 1 }).withMessage('Order items are required'),
  body('items.*.productId').isUUID().withMessage('Valid product ID required'),
  body('items.*.size').trim().notEmpty().withMessage('Size is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const reviewValidator = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment too long'),
];

const newsletterValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('consent').custom((v) => {
    if (v !== true && v !== 'true') throw new Error('Marketing consent is required');
    return true;
  }),
];

const campaignValidator = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
];

module.exports = {
  productValidator,
  categoryValidator,
  cartItemValidator,
  orderValidator,
  reviewValidator,
  newsletterValidator,
  campaignValidator,
};
