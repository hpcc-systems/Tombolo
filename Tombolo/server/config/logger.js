const { createLogger } = require('@tombolo/shared');
const path = require('path');

// Create logger instance with server-specific configuration
const logger = createLogger({
  logDir: path.join(__dirname, '..', 'logs'), // Absolute path to server/logs
  serviceName: 'server',
});

module.exports = logger;
