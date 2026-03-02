const path = require('path');

// Attempt to load shared createLogger; if not available (e.g. during tests or
// in isolated db package usage), fall back to a simple console-based logger
let createLogger;
try {
  // eslint-disable-next-line global-require
  createLogger = require('@tombolo/shared/backend').createLogger;
} catch (err) {
  // Fallback simple logger factory
  createLogger = (opts = {}) => {
    const prefix = opts.logDir ? `[db:${opts.logDir}] ` : '[db] ';
    return {
      debug: (...args) => console.debug(prefix, ...args),
      info: (...args) => console.info(prefix, ...args),
      warn: (...args) => console.warn(prefix, ...args),
      error: (...args) => console.error(prefix, ...args),
    };
  };
}

// Create logger instance for database operations
// Note: When used by server, logs will go to server's log directory
// When used standalone (migrations, seeds), logs go to db/logs
const logger = createLogger({
  logDir: process.env.LOG_DIR || path.join(__dirname, '..', 'logs'),
});

module.exports = logger;
