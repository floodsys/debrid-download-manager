const redis = require('redis');

let client = null;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    client.on('connect', () => {
      console.log('Redis client connected');
    });
    
    client.on('ready', () => {
      console.log('Redis client ready');
    });
    
    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Don't exit the app if Redis fails - it's used for caching/rate limiting
    // The app can still function without it
    return null;
  }
};

const getRedisClient = () => {
  if (!client) {
    console.warn('Redis client not initialized');
  }
  return client;
};

const disconnectRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis
};