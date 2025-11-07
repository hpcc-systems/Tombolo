// Simple logger stub for @tombolo/db
// This re-exports the logger from the server if available, otherwise provides a console fallback
let logger;

logger = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.log.bind(console),
  debug: console.log.bind(console),
  verbose: console.log.bind(console),
};

// try {
//   // Try to require logger from server (for backward compatibility)
//   logger = require('../../server/config/logger');
// } catch (err) {
//   // Fallback to console logging

// }

module.exports = logger;
