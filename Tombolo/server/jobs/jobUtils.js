const logger = require('../config/logger');

function logOrPostMessage(input) {
  try {
    const { parentPort } = require('worker_threads');
    if (parentPort) {
      parentPort.postMessage(input);
      return;
    }
    switch (input.level) {
      case 'error':
        logger.error(input);
        break;

      case 'warn':
        logger.warn(input);
        break;
      case 'verbose':
        logger.verbose(input);
        break;
      default:
        logger.info(input);
        break;
    }
  } catch (error) {
    logger.error('Error posting message:', error);
    logger.error('Message: ', input);
  }
}

module.exports = { logOrPostMessage };
