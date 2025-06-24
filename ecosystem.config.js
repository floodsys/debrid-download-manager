module.exports = {
  apps: [{
    name: 'rd-manager-backend',
    script: 'server.js',              // Just server.js since cwd is already backend
    cwd: './backend',                 // Keep this as is
    env: {
      NODE_ENV: 'production'
    }
  }]
};