const admin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  
  next();
};

// Middleware to check if user is admin or accessing own resources
const adminOrSelf = (userIdParam = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const targetUserId = req.params[userIdParam];
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user._id.toString() === targetUserId;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own resources.' 
      });
    }
    
    req.isAdmin = isAdmin;
    req.isSelf = isSelf;
    
    next();
  };
};

module.exports = { admin, adminOrSelf };