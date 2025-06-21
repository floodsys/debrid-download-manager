require('dotenv').config();
const app = require('./src/app');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { connectRedis } = require('./src/config/redis');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const PORT = process.env.PORT || 5000;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Make io accessible throughout the app
app.set('io', io);
app.set('logger', logger);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`Socket ${socket.id} joined room: user-${userId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realdebrid-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('MongoDB connected successfully');
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Connect to Redis
connectRedis()
  .then(() => {
    logger.info('Redis connected successfully');
  })
  .catch(err => {
    logger.error('Redis connection error:', err);
    // Don't exit on Redis error as it's not critical
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});