const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', loginLimiter, authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.patch('/profile', auth, authController.updateProfile);
router.post('/change-password', auth, authController.changePassword);
router.post('/refresh', auth, authController.refreshToken);
router.post('/logout', auth, authController.logout);

module.exports = router;