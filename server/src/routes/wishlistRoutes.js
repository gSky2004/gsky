const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);
router.get('/', wishlistController.mine);
router.post('/', wishlistController.add);
router.delete('/:productId', wishlistController.remove);

module.exports = router;
