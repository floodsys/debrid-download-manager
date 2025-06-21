const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Public routes (require auth)
router.get('/', auth, categoryController.getCategories);
router.get('/stats', auth, categoryController.getStats);

// Admin only routes
router.post('/', auth, admin, categoryController.createCategory);
router.patch('/:id', auth, admin, categoryController.updateCategory);
router.delete('/:id', auth, admin, categoryController.deleteCategory);

// Test route (admin only)
router.post('/test-auto', auth, admin, categoryController.testAutoCategory);

module.exports = router;