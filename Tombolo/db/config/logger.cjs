const { createLogger } = require('@tombolo/shared/backend');
const path = require('path');

// Create logger instance for database operations
// Note: When used by server, logs will go to server's log directory
// When used standalone (migrations, seeds), logs go to db/logs
const logger = createLogger({
  logDir: process.env.LOG_DIR || path.join(__dirname, '..', 'logs'),
});

module.exports = logger;
