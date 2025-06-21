const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateLogin, validatePasswordChange } = require('../utils/validators');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Login controller
exports.login = async (req, res) => {
  try {
    // Validate input
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }
    
    const { username, password } = req.body;
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        error: 'Account is locked due to multiple failed login attempts. Please try again later.' 
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Account has been deactivated. Please contact administrator.' 
      });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Generate token
    const token = generateToken(user._id, user.role);
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('User login', {
        userId: user._id,
        username: user.username,
        ip: req.ip
      });
    }
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        settings: user.settings,
        downloadQuota: user.downloadQuota
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -loginAttempts -lockUntil')
      .populate('settings.defaultCategory');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile' 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'email',
      'realDebridApiKey',
      'settings.autoCategory',
      'settings.notifications',
      'settings.defaultCategory'
    ];
    
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Validate email if being updated
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email.toLowerCase(),
        _id: { $ne: req.user._id }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email already in use' 
        });
      }
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to update profile' 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    // Validate input
    const { error } = validatePasswordChange(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new token
    const token = generateToken(user._id, user.role);
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('Password changed', {
        userId: user._id,
        username: user.username,
        ip: req.ip
      });
    }
    
    res.json({ 
      message: 'Password updated successfully',
      token 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password' 
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const user = req.user;
    
    // Generate new token
    const token = generateToken(user._id, user.role);
    
    res.json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh token' 
    });
  }
};

// Logout (optional - mainly for token blacklisting if implemented)
exports.logout = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token here
    // For now, we'll just return success
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('User logout', {
        userId: req.user._id,
        username: req.user.username,
        ip: req.ip
      });
    }
    
    res.json({ 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed' 
    });
  }
};