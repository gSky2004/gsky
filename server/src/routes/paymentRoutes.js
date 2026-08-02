const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser, authorizeRole('CLIENT', 'ADMIN'));

router.post('/create', paymentController.create);
router.post('/verify', paymentController.verify);

module.exports = router;
