const express = require('express');
const adminController = require('../controllers/adminController');
const deliveryController = require('../controllers/deliveryController');
const promoController = require('../controllers/promoController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser, authorizeRole('ADMIN'));

router.get('/stats', adminController.stats);
router.get('/sales-series', adminController.salesSeries);
router.get('/orders', adminController.listOrders);
router.get('/orders/:id', adminController.getOrder);
router.put('/orders/:id/status', adminController.updateStatus);
router.get('/customers', adminController.listCustomers);
router.get('/newsletter', adminController.listNewsletter);
router.get('/reviews', adminController.listReviews);
router.post('/test-email', adminController.sendTestEmail);
router.get('/delivery-zones', deliveryController.list);
router.post('/delivery-zones', deliveryController.create);
router.put('/delivery-zones/:id', deliveryController.update);
router.delete('/delivery-zones/:id', deliveryController.remove);
router.get('/promos', promoController.list);
router.post('/promos', promoController.create);
router.put('/promos/:id', promoController.update);
router.delete('/promos/:id', promoController.remove);

module.exports = router;
