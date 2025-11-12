const { createLogger } = require('@tombolo/shared');
const path = require('path');

// Create logger instance with server-specific configuration
const logger = createLogger({
  logDir: path.join(__dirname, '..', 'logs'), // Absolute path to db/logs
  serviceName: 'db',
});

module.exports = logger;
