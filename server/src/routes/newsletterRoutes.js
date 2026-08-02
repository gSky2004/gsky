const express = require('express');
const newsletterController = require('../controllers/newsletterController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { newsletterValidator, campaignValidator } = require('../validators/validators');

const router = express.Router();

router.post('/subscribe', newsletterValidator, validate, newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);
router.get('/status/:email', newsletterController.status);
router.post('/campaign', authenticateUser, authorizeRole('ADMIN'), campaignValidator, validate, newsletterController.sendCampaign);

module.exports = router;
