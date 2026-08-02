const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { orderValidator } = require('../validators/validators');

const router = express.Router();

router.get('/track', orderController.track);

router.use(authenticateUser, authorizeRole('CLIENT', 'ADMIN'));

router.post('/', orderValidator, validate, orderController.create);
router.get('/', orderController.mine);
router.post('/:id/confirm', orderController.confirmDelivery);
router.get('/:id', orderController.getById);

module.exports = router;
