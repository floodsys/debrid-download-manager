const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findOne({ 
      _id: decoded.userId, 
      isActive: true 
    }).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is locked
    if (user.isLocked) {
      throw new Error('Account is locked');
    }
    
    // Attach user and token to request
    req.token = token;
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    let message = 'Please authenticate';
    let status = 401;
    
    if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (error.message === 'Account is locked') {
      message = 'Account is locked due to multiple failed login attempts';
      status = 423; // Locked
    }
    
    res.status(status).json({ error: message });
  }
};

// Optional auth middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return next();
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ 
      _id: decoded.userId, 
      isActive: true 
    }).select('-password');
    
    if (user && !user.isLocked) {
      req.token = token;
      req.user = user;
      req.userId = user._id.toString();
    }
    
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

module.exports = { auth, optionalAuth };