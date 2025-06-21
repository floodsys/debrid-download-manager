const mongoose = require('mongoose');
const User = require('../models/User');
const Download = require('../models/Download');
const Category = require('../models/Category');
const RealDebridService = require('../services/realDebridService');
const { validateUserCreation, validateUserUpdate } = require('../utils/validators');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      role,
      isActive,
      sort = '-createdAt'
    } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password -realDebridApiKey')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await User.countDocuments(query);
    
    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const downloadStats = await Download.getUserStats(user._id);
        return {
          ...user,
          stats: {
            totalDownloads: downloadStats.total,
            completedDownloads: downloadStats.byStatus?.completed || 0,
            totalSize: downloadStats.totalSize
          }
        };
      })
    );
    
    res.json({
      users: usersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users' 
    });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    // Get user stats
    const downloadStats = await Download.getUserStats(user._id);
    
    res.json({
      ...user.toJSON(),
      stats: {
        totalDownloads: downloadStats.total,
        completedDownloads: downloadStats.byStatus?.completed || 0,
        activeDownloads: (downloadStats.byStatus?.downloading || 0) + (downloadStats.byStatus?.queued || 0),
        errorDownloads: downloadStats.byStatus?.error || 0,
        totalSize: downloadStats.totalSize
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user' 
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    // Validate input
    const { error } = validateUserCreation(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }
    
    const { 
      username, 
      email, 
      password, 
      realDebridApiKey,
      role = 'user',
      downloadQuota,
      settings
    } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this username or email already exists' 
      });
    }
    
    // Validate Real-Debrid API key
    if (realDebridApiKey && role !== 'admin') {
      try {
        const rdService = new RealDebridService(realDebridApiKey);
        const valid = await rdService.validateApiKey();
        if (!valid) {
          return res.status(400).json({ 
            error: 'Invalid Real-Debrid API key' 
          });
        }
      } catch (rdError) {
        return res.status(400).json({ 
          error: 'Failed to validate Real-Debrid API key' 
        });
      }
    }
    
    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      realDebridApiKey,
      role,
      downloadQuota: downloadQuota || undefined,
      settings: settings || undefined
    });
    
    await user.save();
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('User created by admin', {
        adminId: req.user._id,
        adminUsername: req.user.username,
        newUserId: user._id,
        newUsername: user.username,
        role: user.role
      });
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to create user' 
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    // Validate input
    const { error } = validateUserUpdate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }
    
    const userId = req.params.userId;
    const updates = {};
    
    // Allowed updates
    const allowedUpdates = [
      'email',
      'isActive',
      'realDebridApiKey',
      'downloadQuota',
      'settings',
      'role'
    ];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Validate email uniqueness if being updated
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email already in use' 
        });
      }
      
      updates.email = updates.email.toLowerCase();
    }
    
    // Validate Real-Debrid API key if being updated
    if (updates.realDebridApiKey) {
      try {
        const rdService = new RealDebridService(updates.realDebridApiKey);
        const valid = await rdService.validateApiKey();
        if (!valid) {
          return res.status(400).json({ 
            error: 'Invalid Real-Debrid API key' 
          });
        }
      } catch (rdError) {
        return res.status(400).json({ 
          error: 'Failed to validate Real-Debrid API key' 
        });
      }
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('User updated by admin', {
        adminId: req.user._id,
        adminUsername: req.user.username,
        userId: user._id,
        username: user.username,
        updates: Object.keys(updates)
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to update user' 
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    // Prevent deleting admin users
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last admin user' 
        });
      }
    }
    
    // Delete all user's downloads
    const deletedDownloads = await Download.deleteMany({ user: userId });
    
    // Delete user
    await user.deleteOne();
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('User deleted by admin', {
        adminId: req.user._id,
        adminUsername: req.user.username,
        deletedUserId: userId,
        deletedUsername: user.username,
        deletedDownloads: deletedDownloads.deletedCount
      });
    }
    
    res.json({ 
      message: 'User and associated data deleted successfully',
      deletedDownloads: deletedDownloads.deletedCount
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user' 
    });
  }
};

// Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('User password reset by admin', {
        adminId: req.user._id,
        adminUsername: req.user.username,
        userId: user._id,
        username: user.username
      });
    }
    
    res.json({ 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password' 
    });
  }
};

// Get user's downloads
exports.getUserDownloads = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { 
      category, 
      status, 
      page = 1, 
      limit = 20,
      sort = '-createdAt'
    } = req.query;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    // Build query
    const query = { user: userId };
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
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
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user downloads error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user downloads' 
    });
  }
};

// Get system statistics
exports.getStats = async (req, res) => {
  try {
    // User stats
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      lockedUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ lockUntil: { $gt: new Date() } })
    ]);
    
    // Download stats
    const downloadStats = await Download.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' },
          byStatus: {
            $push: '$status'
          }
        }
      },
      {
        $project: {
          total: 1,
          totalSize: 1,
          avgSize: 1,
          statusCounts: {
            $reduce: {
              input: '$byStatus',
              initialValue: {
                queued: 0,
                downloading: 0,
                completed: 0,
                error: 0,
                paused: 0
              },
              in: {
                queued: {
                  $cond: [{ $eq: ['$$this', 'queued'] }, 
                    { $add: ['$$value.queued', 1] }, 
                    '$$value.queued'
                  ]
                },
                downloading: {
                  $cond: [{ $eq: ['$$this', 'downloading'] }, 
                    { $add: ['$$value.downloading', 1] }, 
                    '$$value.downloading'
                  ]
                },
                completed: {
                  $cond: [{ $eq: ['$$this', 'completed'] }, 
                    { $add: ['$$value.completed', 1] }, 
                    '$$value.completed'
                  ]
                },
                error: {
                  $cond: [{ $eq: ['$$this', 'error'] }, 
                    { $add: ['$$value.error', 1] }, 
                    '$$value.error'
                  ]
                },
                paused: {
                  $cond: [{ $eq: ['$$this', 'paused'] }, 
                    { $add: ['$$value.paused', 1] }, 
                    '$$value.paused'
                  ]
                }
              }
            }
          }
        }
      }
    ]);
    
    const dlStats = downloadStats[0] || {
      total: 0,
      totalSize: 0,
      avgSize: 0,
      statusCounts: {
        queued: 0,
        downloading: 0,
        completed: 0,
        error: 0,
        paused: 0
      }
    };
    
    // Category stats
    const categoryStats = await Category.getStats();
    
    // Activity stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await Download.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
        locked: lockedUsers,
        regular: totalUsers - adminUsers
      },
      downloads: {
        total: dlStats.total,
        totalSize: dlStats.totalSize,
        averageSize: Math.round(dlStats.avgSize || 0),
        byStatus: dlStats.statusCounts,
        active: dlStats.statusCounts.downloading + dlStats.statusCounts.queued,
        successRate: dlStats.total > 0 
          ? Math.round((dlStats.statusCounts.completed / dlStats.total) * 100) 
          : 0
      },
      categories: categoryStats,
      activity: {
        last7Days: recentActivity
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics' 
    });
  }
};

// Get system information
exports.getSystemInfo = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus];
    
    res.json({
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      database: {
        status: dbStatusText,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Get system info error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system information' 
    });
  }
};

// Validate Real-Debrid API key
exports.validateApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key is required' 
      });
    }
    
    const rdService = new RealDebridService(apiKey);
    
    try {
      const userInfo = await rdService.getUserInfo();
      
      res.json({
        valid: true,
        userInfo: {
          username: userInfo.username,
          email: userInfo.email,
          premium: userInfo.type === 'premium',
          expiration: userInfo.expiration,
          points: userInfo.points
        }
      });
    } catch (rdError) {
      res.json({
        valid: false,
        error: rdError.message
      });
    }
  } catch (error) {
    console.error('Validate API key error:', error);
    res.status(500).json({ 
      error: 'Failed to validate API key' 
    });
  }
};

// Get Real-Debrid hosts status
exports.getHostsStatus = async (req, res) => {
  try {
    // Use admin's API key or a system-wide key
    const apiKey = process.env.REAL_DEBRID_API_KEY || req.user.realDebridApiKey;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'No Real-Debrid API key configured' 
      });
    }
    
    const rdService = new RealDebridService(apiKey);
    const hostsStatus = await rdService.getHostsStatus();
    
    res.json(hostsStatus);
  } catch (error) {
    console.error('Get hosts status error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hosts status' 
    });
  }
};