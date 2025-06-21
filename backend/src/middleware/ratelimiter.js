const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

// Create rate limiter with Redis store
const createLimiter = (options) => {
  const redisClient = getRedisClient();
  
  const limiterOptions = {
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  };
  
  // Use Redis store if available, otherwise use memory store
  if (redisClient && redisClient.isOpen) {
    limiterOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });
  }
  
  return rateLimit(limiterOptions);
};

// Login limiter - stricter limits
exports.loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// API limiter - general rate limit
exports.apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
});

// Download limiter - limit download creation
exports.downloadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 downloads per hour
  message: 'Too many downloads created, please try again later',
  skip: (req) => req.user?.role === 'admin', // Skip for admins
});

// Strict limiter for sensitive operations
exports.strictLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many requests for this operation, please try again later',
});