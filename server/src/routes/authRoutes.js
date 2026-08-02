const express = require('express');
const { register, login, me, logout, updateProfile } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerValidator, loginValidator, profileValidator } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', authenticateUser, me);
router.post('/logout', authenticateUser, logout);
router.put('/profile', authenticateUser, profileValidator, validate, updateProfile);

module.exports = router;
