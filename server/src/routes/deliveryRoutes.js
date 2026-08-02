const express = require('express');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();

router.get('/', deliveryController.list);

module.exports = router;
