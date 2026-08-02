const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

router.get('/valid', promoController.getValid);

router.use(authenticateUser, authorizeRole('ADMIN'));
router.get('/', promoController.list);
router.post('/', promoController.create);
router.put('/:id', promoController.update);
router.delete('/:id', promoController.remove);

module.exports = router;
