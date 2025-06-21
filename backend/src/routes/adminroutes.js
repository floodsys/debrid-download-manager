const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// All admin routes require authentication and admin role
router.use(auth, admin);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUser);
router.post('/users', adminController.createUser);
router.patch('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);
router.get('/users/:userId/downloads', adminController.getUserDownloads);

// System management
router.get('/stats', adminController.getStats);
router.get('/system', adminController.getSystemInfo);

// Real-Debrid management
router.post('/validate-api-key', adminController.validateApiKey);
router.get('/hosts-status', adminController.getHostsStatus);

module.exports = router;