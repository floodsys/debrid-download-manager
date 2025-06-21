const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const { auth } = require('../middleware/auth');
const { downloadLimiter } = require('../middleware/rateLimiter');

// All download routes require authentication
router.use(auth);

// Download management
router.post('/', downloadLimiter, downloadController.addDownload);
router.get('/', downloadController.getDownloads);
router.get('/stats', downloadController.getStats);
router.get('/:id', downloadController.getDownload);
router.patch('/:id', downloadController.updateDownload);
router.delete('/:id', downloadController.deleteDownload);

// Download actions
router.post('/:id/pause', downloadController.pauseDownload);
router.post('/:id/resume', downloadController.resumeDownload);
router.post('/:id/retry', downloadController.retryDownload);

module.exports = router;