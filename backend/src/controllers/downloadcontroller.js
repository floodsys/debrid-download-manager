const Download = require('../models/Download');
const Category = require('../models/Category');
const RealDebridService = require('../services/realDebridService');
const { validateAddDownload } = require('../utils/validators');

// Add new download
exports.addDownload = async (req, res) => {
  try {
    // Validate input
    const { error } = validateAddDownload(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }
    
    const { magnetLink, categoryId } = req.body;
    const userId = req.user._id;
    
    // Check user quota
    const user = req.user;
    if (!user.canDownload()) {
      // Reset quota if needed
      if (user.downloadQuota.resetAt <= new Date()) {
        user.downloadQuota.used = 0;
        user.downloadQuota.resetAt = new Date().setHours(24, 0, 0, 0);
        await user.save();
      } else {
        return res.status(429).json({ 
          error: 'Daily download quota exceeded',
          quotaResetAt: user.downloadQuota.resetAt
        });
      }
    }
    
    // Initialize Real-Debrid service
    const rdService = new RealDebridService(user.realDebridApiKey);
    
    try {
      // Add magnet to Real-Debrid
      const torrentData = await rdService.addMagnet(magnetLink);
      
      // Extract name
      const name = torrentData.filename || extractNameFromMagnet(magnetLink);
      
      // Determine category
      let finalCategoryId = categoryId;
      if (!categoryId) {
        const autoCategory = await Category.autoDetectCategory(name);
        if (autoCategory) {
          finalCategoryId = autoCategory._id;
        } else {
          const defaultCategory = await Category.getDefaultCategory();
          finalCategoryId = defaultCategory?._id;
        }
      }
      
      // Create download record
      const download = new Download({
        user: userId,
        magnetLink,
        torrentId: torrentData.id,
        name,
        category: finalCategoryId,
        status: 'queued',
        realDebridData: {
          id: torrentData.id,
          hash: torrentData.hash,
          originalFilename: torrentData.original_filename,
          host: torrentData.host,
          split: torrentData.split,
          progress: torrentData.progress || 0,
          status: torrentData.status,
          added: torrentData.added
        }
      });
      
      await download.save();
      await download.populate('category');
      
      // Update user quota
      user.downloadQuota.used += 1;
      await user.save();
      
      // Update category stats
      if (finalCategoryId) {
        await Category.findByIdAndUpdate(finalCategoryId, {
          $inc: { 'stats.totalDownloads': 1 },
          $set: { 'stats.lastUsed': new Date() }
        });
      }
      
      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('download-added', download);
      }
      
      // Start processing the download
      processDownload(download._id, rdService, io, req.app.get('logger'));
      
      res.status(201).json(download);
    } catch (rdError) {
      // Real-Debrid API error
      const logger = req.app.get('logger');
      if (logger) {
        logger.error('Real-Debrid API error:', {
          error: rdError.message,
          code: rdError.code,
          userId: userId
        });
      }
      
      return res.status(rdError.status || 500).json({ 
        error: rdError.message || 'Failed to add download to Real-Debrid',
        code: rdError.code
      });
    }
  } catch (error) {
    console.error('Add download error:', error);
    res.status(500).json({ 
      error: 'Failed to add download' 
    });
  }
};

// Get all downloads for user
exports.getDownloads = async (req, res) => {
  try {
    const { 
      category, 
      status, 
      search,
      page = 1, 
      limit = 20,
      sort = '-createdAt'
    } = req.query;
    
    const userId = req.user._id;
    
    // Build query
    const query = { user: userId };
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Execute query with pagination
    const downloads = await Download.find(query)
      .populate('category')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Download.countDocuments(query);
    
    res.json({
      downloads,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get downloads error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch downloads' 
    });
  }
};

// Get single download
exports.getDownload = async (req, res) => {
  try {
    const download = await Download.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('category');
    
    if (!download) {
      return res.status(404).json({ 
        error: 'Download not found' 
      });
    }
    
    res.json(download);
  } catch (error) {
    console.error('Get download error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch download' 
    });
  }
};

// Update download
exports.updateDownload = async (req, res) => {
  try {
    const allowedUpdates = ['category', 'notes', 'tags', 'priority'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const download = await Download.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      updates,
      { new: true, runValidators: true }
    ).populate('category');
    
    if (!download) {
      return res.status(404).json({ 
        error: 'Download not found' 
      });
    }
    
    res.json(download);
  } catch (error) {
    console.error('Update download error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to update download' 
    });
  }
};

// Delete download
exports.deleteDownload = async (req, res) => {
  try {
    const download = await Download.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!download) {
      return res.status(404).json({ 
        error: 'Download not found' 
      });
    }
    
    // Try to delete from Real-Debrid if still active
    if (download.torrentId && ['queued', 'downloading', 'paused'].includes(download.status)) {
      try {
        const rdService = new RealDebridService(req.user.realDebridApiKey);
        await rdService.deleteTorrent(download.torrentId);
      } catch (rdError) {
        // Log but don't fail the deletion
        console.error('Failed to delete from Real-Debrid:', rdError);
      }
    }
    
    await download.deleteOne();
    
    // Update category stats
    if (download.category) {
      await Category.findByIdAndUpdate(download.category, {
        $inc: { 'stats.totalDownloads': -1 }
      });
    }
    
    res.json({ 
      message: 'Download deleted successfully' 
    });
  } catch (error) {
    console.error('Delete download error:', error);
    res.status(500).json({ 
      error: 'Failed to delete download' 
    });
  }
};

// Pause download
exports.pauseDownload = async (req, res) => {
  try {
    const download = await Download.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'downloading'
    });
    
    if (!download) {
      return res.status(404).json({ 
        error: 'Active download not found' 
      });
    }
    
    download.status = 'paused';
    await download.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.user._id}`).emit('download-update', {
        id: download._id,
        status: 'paused'
      });
    }
    
    res.json({ 
      message: 'Download paused',
      download 
    });
  } catch (error) {
    console.error('Pause download error:', error);
    res.status(500).json({ 
      error: 'Failed to pause download' 
    });
  }
};

// Resume download
exports.resumeDownload = async (req, res) => {
  try {
    const download = await Download.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'paused'
    });
    
    if (!download) {
      return res.status(404).json({ 
        error: 'Paused download not found' 
      });
    }
    
    download.status = 'downloading';
    await download.save();
    
    // Restart processing
    const rdService = new RealDebridService(req.user.realDebridApiKey);
    processDownload(download._id, rdService, req.app.get('io'), req.app.get('logger'));
    
    res.json({ 
      message: 'Download resumed',
      download 
    });
  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).json({ 
      error: 'Failed to resume download' 
    });
  }
};

// Retry download
exports.retryDownload = async (req, res) => {
  try {
    const download = await Download.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: { $in: ['error', 'cancelled'] }
    });
    
    if (!download) {
      return res.status(404).json({ 
        error: 'Failed download not found' 
      });
    }
    
    // Reset download status
    download.status = 'queued';
    download.progress = 0;
    download.error = undefined;
    download.completedAt = undefined;
    await download.save();
    
    // Re-add to Real-Debrid
    const rdService = new RealDebridService(req.user.realDebridApiKey);
    try {
      const torrentData = await rdService.addMagnet(download.magnetLink);
      download.torrentId = torrentData.id;
      download.realDebridData.id = torrentData.id;
      await download.save();
      
      // Start processing
      processDownload(download._id, rdService, req.app.get('io'), req.app.get('logger'));
      
      res.json({ 
        message: 'Download restarted',
        download 
      });
    } catch (rdError) {
      download.status = 'error';
      download.error = {
        message: rdError.message,
        code: rdError.code,
        timestamp: new Date()
      };
      await download.save();
      
      return res.status(500).json({ 
        error: 'Failed to restart download' 
      });
    }
  } catch (error) {
    console.error('Retry download error:', error);
    res.status(500).json({ 
      error: 'Failed to retry download' 
    });
  }
};

// Get download statistics
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Download.getUserStats(userId);
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics' 
    });
  }
};

// Helper function to extract name from magnet
function extractNameFromMagnet(magnetLink) {
  const match = magnetLink.match(/dn=([^&]+)/);
  if (match) {
    return decodeURIComponent(match[1].replace(/\+/g, ' '));
  }
  return 'Unknown Download';
}

// Background processing function
async function processDownload(downloadId, rdService, io, logger) {
  const maxRetries = 3;
  let retryCount = 0;
  
  const checkStatus = async () => {
    try {
      const download = await Download.findById(downloadId);
      if (!download || download.status === 'paused') {
        return;
      }
      
      // Get torrent info from Real-Debrid
      const torrentInfo = await rdService.getTorrentInfo(download.torrentId);
      
      // Map Real-Debrid status to our status
      const statusMap = {
        'magnet_error': 'error',
        'magnet_conversion': 'queued',
        'waiting_files_selection': 'queued',
        'queued': 'queued',
        'downloading': 'downloading',
        'downloaded': 'completed',
        'error': 'error',
        'virus': 'error',
        'compressing': 'downloading',
        'uploading': 'downloading',
        'dead': 'error'
      };
      
      const newStatus = statusMap[torrentInfo.status] || 'queued';
      
      // Update download info
      download.status = newStatus;
      download.progress = torrentInfo.progress || 0;
      download.size = torrentInfo.bytes || 0;
      download.seeders = torrentInfo.seeders || 0;
      download.peers = torrentInfo.peers || 0;
      download.downloadSpeed = torrentInfo.speed || 0;
      
      // Update Real-Debrid data
      download.realDebridData.status = torrentInfo.status;
      download.realDebridData.progress = torrentInfo.progress;
      download.realDebridData.files = torrentInfo.files;
      download.realDebridData.links = torrentInfo.links;
      download.realDebridData.ended = torrentInfo.ended;
      
      // Handle completed download
      if (torrentInfo.status === 'downloaded' && torrentInfo.links && torrentInfo.links.length > 0) {
        // Select all files
        await rdService.selectFiles(download.torrentId);
        
        // Get updated info with links
        const updatedInfo = await rdService.getTorrentInfo(download.torrentId);
        
        if (updatedInfo.links && updatedInfo.links.length > 0) {
          download.status = 'unrestricting';
          download.realDebridData.links = updatedInfo.links;
          
          // Unrestrict all links
          const unrestrictedLinks = [];
          for (const link of updatedInfo.links) {
            try {
              const unrestricted = await rdService.unrestrictLink(link);
              unrestrictedLinks.push({
                original: link,
                download: unrestricted.download,
                filename: unrestricted.filename,
                filesize: unrestricted.filesize,
                mimeType: unrestricted.mimeType,
                host: unrestricted.host,
                chunks: unrestricted.chunks,
                streamable: unrestricted.streamable
              });
            } catch (err) {
              if (logger) {
                logger.error('Failed to unrestrict link:', {
                  link,
                  error: err.message,
                  downloadId: download._id
                });
              }
            }
          }
          
          download.realDebridData.unrestrictedLinks = unrestrictedLinks;
          download.status = 'completed';
          download.completedAt = new Date();
          download.progress = 100;
          
          // Calculate stats
          if (download.startedAt) {
            const downloadTime = (download.completedAt - download.startedAt) / 1000;
            download.stats.downloadTime = downloadTime;
            if (download.size && downloadTime > 0) {
              download.stats.averageSpeed = Math.round(download.size / downloadTime);
            }
          }
          
          // Emit completion event
          if (io) {
            io.to(`user-${download.user}`).emit('download-completed', {
              id: download._id,
              name: download.name,
              unrestrictedLinks: download.realDebridData.unrestrictedLinks
            });
          }
        }
      }
      
      // Handle errors
      if (newStatus === 'error') {
        download.error = {
          message: torrentInfo.status === 'virus' ? 'Virus detected' : 'Download failed',
          code: torrentInfo.status,
          timestamp: new Date()
        };
        
        if (io) {
          io.to(`user-${download.user}`).emit('download-error', {
            id: download._id,
            error: download.error
          });
        }
      }
      
      await download.save();
      
      // Emit status update
      if (io) {
        io.to(`user-${download.user}`).emit('download-update', {
          id: download._id,
          status: download.status,
          progress: download.progress,
          downloadSpeed: download.downloadSpeed,
          seeders: download.seeders,
          eta: download.eta
        });
      }
      
      // Continue checking if not completed or errored
      if (!['completed', 'error', 'paused'].includes(download.status)) {
        setTimeout(checkStatus, 5000); // Check every 5 seconds
      }
      
      // Reset retry count on successful check
      retryCount = 0;
      
    } catch (error) {
      if (logger) {
        logger.error('Download processing error:', {
          downloadId,
          error: error.message,
          retryCount
        });
      }
      
      retryCount++;
      
      if (retryCount < maxRetries) {
        // Retry after delay
        setTimeout(checkStatus, 10000 * retryCount);
      } else {
        // Mark as error after max retries
        try {
          const download = await Download.findById(downloadId);
          if (download) {
            await download.markAsError({
              message: 'Processing failed after multiple retries',
              code: 'PROCESSING_ERROR',
              details: { originalError: error.message }
            });
            
            if (io) {
              io.to(`user-${download.user}`).emit('download-error', {
                id: download._id,
                error: download.error
              });
            }
          }
        } catch (updateError) {
          console.error('Failed to update download error state:', updateError);
        }
      }
    }
  };
  
  // Start checking status
  checkStatus();
}