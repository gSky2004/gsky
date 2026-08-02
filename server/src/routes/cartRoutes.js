const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { cartItemValidator } = require('../validators/validators');

const router = express.Router();

router.use(authenticateUser, authorizeRole('CLIENT', 'ADMIN'));

router.get('/', cartController.show);
router.post('/items', cartItemValidator, validate, cartController.addItem);
router.put('/items/:id', cartController.updateItem);
router.delete('/items/:id', cartController.removeItem);
router.delete('/', cartController.clear);

module.exports = router;
