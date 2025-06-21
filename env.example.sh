# Docker Environment Configuration
# Copy this file to .env and update with your values

# MongoDB Configuration
MONGO_ROOT_PASSWORD=changethisverysecurepassword

# Redis Configuration  
REDIS_PASSWORD=anothersecureredispassword

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Session Configuration
SESSION_SECRET=your-session-secret-also-very-long-and-random

# Real-Debrid Configuration
REAL_DEBRID_API_KEY=your-real-debrid-api-key-here

# Application URLs
FRONTEND_URL=http://localhost
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# SSL Configuration (for production)
# SSL_CERT_PATH=/path/to/cert.pem
# SSL_KEY_PATH=/path/to/key.pem

# Admin Account (for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changethisimmediately

# Optional: External Services
# SENTRY_DSN=your-sentry-dsn-for-error-tracking
# LOGSTASH_HOST=logstash.example.com
# LOGSTASH_PORT=5000