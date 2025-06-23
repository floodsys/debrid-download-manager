# Debrid Download Manager

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [System Requirements](#-system-requirements)
- [Installation](#-installation)
  - [1. System Preparation](#1-system-preparation)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Application Setup](#3-application-setup)
  - [4. Production Deployment](#4-production-deployment)
- [Configuration](#-configuration)
- [SSL Certificate](#-ssl-certificate)
- [Monitoring & Maintenance](#-monitoring--maintenance)
- [Troubleshooting](#-troubleshooting)
- [Quick Start Commands](#-quick-start-commands)

## 💻 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 2 GB | 4 GB |
| **Storage** | 10 GB | 20 GB+ |
| **OS** | Ubuntu 22.04+ / Debian 12+ | Ubuntu 22.04 LTS |

## 🔧 Prerequisites

Before starting the installation, ensure you have:

- ✅ Root or sudo access
- ✅ A domain name (optional, for SSL)
- ✅ Real-Debrid Premium Account
- ✅ Basic knowledge of Linux command line


### 🚀 Real-Debrid Download Manager Installation Guide 

<div align="center">

 ![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04+-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)
![Debian](https://img.shields.io/badge/Debian-12+-A81D33?style=for-the-badge&logo=debian&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=for-the-badge&logo=redis&logoColor=white)

</div>

## 📦 Installation

### 1. System Preparation

First, update your system and install essential tools:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential software-properties-common
```

### 2. Install Dependencies

<details>
<summary><b>📗 Node.js 18.x Installation</b></summary>

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

</details>

<details>
<summary><b>🍃 MongoDB 6.0 Installation</b></summary>

```bash
# Import MongoDB GPG key
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update and install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

</details>

<details>
<summary><b>🔴 Redis Installation</b></summary>

```bash
# Install Redis
sudo apt install -y redis-server

# Secure Redis with a password
sudo sed -i 's/^# requirepass foobared/requirepass YOUR_STRONG_REDIS_PASSWORD/g' /etc/redis/redis.conf

# Configure for systemd
sudo sed -i 's/^supervised no/supervised systemd/g' /etc/redis/redis.conf

# Restart and enable Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Test Redis connection
redis-cli ping
# Should return: PONG
```

</details>

<details>
<summary><b>🌐 Nginx Installation</b></summary>

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

</details>

<details>
<summary><b>🔄 PM2 Process Manager</b></summary>

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd
# Follow the command output instructions
```

</details>

### 3. Application Setup

#### 📂 Clone and Prepare Application

```bash
# Create application directory
sudo mkdir -p /opt/real-debrid-manager
sudo chown $USER:$USER /opt/real-debrid-manager

# Clone repository (replace with your repo URL)
cd /opt
git clone https://github.com/yourusername/real-debrid-manager.git
cd real-debrid-manager
```

#### ⚙️ Backend Configuration

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Generate secure secrets
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"

# Edit configuration
nano .env
```

<details>
<summary><b>📝 Backend .env Configuration</b></summary>

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/realdebrid-manager

# Redis
REDIS_URL=redis://:YOUR_STRONG_REDIS_PASSWORD@localhost:6379

# JWT Secret (use generated value)
JWT_SECRET=your-generated-jwt-secret

# Real-Debrid
REAL_DEBRID_API_KEY=your-real-debrid-api-key

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=change_this_immediately

# CORS
FRONTEND_URL=http://localhost:3000

# Session Secret (use generated value)
SESSION_SECRET=your-generated-session-secret
```

</details>

#### 🎨 Frontend Configuration

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env
```

<details>
<summary><b>📝 Frontend .env Configuration</b></summary>

```env

<details>
<summary><b>📝 Frontend .env Configuration</b></summary>

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

</details>

#### 🗄️ Initialize Database

```bash
# Go back to backend directory
cd ../backend

# Create admin user
npm run init-admin

# Seed default categories
npm run seed-categories
```

#### 🏗️ Build Frontend

```bash
# Navigate to frontend
cd ../frontend

# Build production files
npm run build
```

### 4. Production Deployment

#### 🚀 Option A: PM2 Deployment (Recommended)

<details>
<summary><b>Configure PM2</b></summary>

```bash
# Navigate to project root
cd /opt/real-debrid-manager

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'rd-manager-backend',
    script: './backend/server.js',
    cwd: './backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
# Execute the command shown in output
```

</details>

#### 🎯 Option B: Systemd Service

<details>
<summary><b>Configure Systemd</b></summary>

```bash
# Create service file
sudo nano /etc/systemd/system/rd-manager.service
```

Add the following content:

```ini
[Unit]
Description=Real-Debrid Manager
After=network.target mongodb.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/real-debrid-manager/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=rd-manager
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable rd-manager
sudo systemctl start rd-manager
sudo systemctl status rd-manager
```

</details>

## 🌐 Nginx Configuration

Create Nginx configuration for your domain:

```bash
sudo nano /etc/nginx/sites-available/real-debrid-manager
```

<details>
<summary><b>📄 Nginx Configuration File</b></summary>

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        root /opt/real-debrid-manager/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

</details>

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/real-debrid-manager /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔒 SSL Certificate

Secure your installation with Let's Encrypt:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

After SSL is configured, update your environment files:

<details>
<summary><b>🔄 Update URLs for HTTPS</b></summary>

Backend `.env`:
```env
FRONTEND_URL=https://your-domain.com
```

Frontend - rebuild with new settings:
```bash
cd /opt/real-debrid-manager/frontend

# Update .env
nano .env
# Change to: VITE_API_URL=https://your-domain.com/api
# Change to: VITE_SOCKET_URL=https://your-domain.com

# Rebuild
npm run build

# Restart backend
pm2 restart rd-manager-backend
```

</details>

## 🛡️ Firewall Configuration

```bash
# Install UFW if not present
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable
sudo ufw status
```

## 📊 Monitoring & Maintenance

### 📈 Real-time Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs rd-manager-backend --lines 100

# System resources
htop

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 💾 Automated Backups

<details>
<summary><b>Create Backup Script</b></summary>

```bash
# Create backup script
sudo nano /opt/real-debrid-manager/backup.sh
```

Add the following:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/backups/rd-manager"
DATE=$(date +%Y%m%d_%H%M%S)
REDIS_PASS="YOUR_STRONG_REDIS_PASSWORD"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
echo "📦 Backing up MongoDB..."
mongodump --archive=$BACKUP_DIR/mongodb_$DATE.gz --gzip

# Backup Redis
echo "📦 Backing up Redis..."
redis-cli -a $REDIS_PASS --rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup environment files
echo "📦 Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  /opt/real-debrid-manager/backend/.env \
  /opt/real-debrid-manager/frontend/.env \
  /opt/real-debrid-manager/ecosystem.config.js

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "✅ Backup completed: $DATE"
```

Make executable and schedule:

```bash
# Make executable
chmod +x /opt/real-debrid-manager/backup.sh

# Add to crontab (daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/real-debrid-manager/backup.sh") | crontab -
```

</details>

### 🔄 Updates

```bash
# Navigate to project
cd /opt/real-debrid-manager

# Backup before updating
./backup.sh

# Pull latest changes
git pull

# Update backend
cd backend
npm install
pm2 restart rd-manager-backend

# Update frontend
cd ../frontend
npm install
npm run build

# Check status
pm2 status
```

## 🐛 Troubleshooting

### Common Issues & Solutions

<details>
<summary><b>🔴 MongoDB Connection Failed</b></summary>

```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo journalctl -u mongod -n 50

# Restart MongoDB
sudo systemctl restart mongod

# Verify connection
mongosh --eval "db.adminCommand('ping')"
```

</details>

<details>
<summary><b>🔴 Redis Connection Failed</b></summary>

```bash
# Check Redis status
sudo systemctl status redis

# Test connection with password
redis-cli -a YOUR_STRONG_REDIS_PASSWORD ping

# View Redis logs
sudo journalctl -u redis -n 50

# Restart Redis
sudo systemctl restart redis
```

</details>

<details>
<summary><b>🔴 Port Already in Use</b></summary>

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process (replace PID)
sudo kill -9 <PID>

# Or change port in .env file
```

</details>

<details>
<summary><b>🔴 Permission Issues</b></summary>

```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/real-debrid-manager

# Fix directory permissions
find /opt/real-debrid-manager -type d -exec chmod 755 {} \;

# Fix file permissions
find /opt/real-debrid-manager -type f -exec chmod 644 {} \;

# Make scripts executable
chmod +x /opt/real-debrid-manager/backup.sh
```

</details>

### 📋 Health Checks

```bash
# Create health check script
cat > /opt/real-debrid-manager/health-check.sh << 'EOF'
#!/bin/bash

echo "🏥 Real-Debrid Manager Health Check"
echo "===================================="

# Check services
echo -n "MongoDB: "
systemctl is-active mongod || echo "❌ DOWN"

echo -n "Redis: "
systemctl is-active redis || echo "❌ DOWN"

echo -n "Nginx: "
systemctl is-active nginx || echo "❌ DOWN"

echo -n "Backend: "
pm2 status rd-manager-backend | grep -q "online" && echo "✅ Running" || echo "❌ DOWN"

# Check disk space
echo -e "\n💾 Disk Space:"
df -h | grep -E "^/dev/"

# Check memory
echo -e "\n🧠 Memory Usage:"
free -h

echo -e "\n✅ Health check complete!"
EOF

chmod +x /opt/real-debrid-manager/health-check.sh
```

## 🚀 Quick Start Commands

```bash
# Start all services
pm2 start all

# Stop all services
pm2 stop all

# Restart backend
pm2 restart rd-manager-backend

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Backup now
/opt/real-debrid-manager/backup.sh

# Health check
/opt/real-debrid-manager/health-check.sh
```

## 🎉 Post-Installation

### First Login

1. Navigate to `https://your-domain.com`
2. Login with the admin credentials from your `.env` file
3. **Important**: Change the admin password immediately

### Security Checklist

- [x] Change default admin password
- [x] Set strong Redis password
- [x] Enable firewall
- [x] Configure SSL certificate
- [x] Set up automated backups
- [x] Review and update JWT secrets

### Performance Optimization

<details>
<summary><b>⚡ MongoDB Optimization</b></summary>

```bash
# Connect to MongoDB
mongosh

# Switch to database
use realdebrid-manager

# Create indexes
db.downloads.createIndex({ user: 1, status: 1 })
db.downloads.createIndex({ user: 1, createdAt: -1 })
db.users.createIndex({ username: 1 })
db.users.createIndex({ email: 1 })
```

</details>

<details>
<summary><b>⚡ PM2 Optimization</b></summary>

```javascript
// Update ecosystem.config.js for clustering
module.exports = {
  apps: [{
    name: 'rd-manager-backend',
    script: './backend/server.js',
    cwd: './backend',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true
  }]
};
```

</details>

## 📞 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review application logs: `pm2 logs`
3. Check system logs: `sudo journalctl -xe`
4. Open an issue on GitHub with:
   - Error messages
   - System information
   - Steps to reproduce

---

<div align="center">

**🎉 Congratulations! Your Real-Debrid Download Manager is now installed and running!**

Access your installation at: `https://your-domain.com`