import logger from '../config/logger.js';
import { parentPort } from 'worker_threads';

function logOrPostMessage(input) {
  try {
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

export { logOrPostMessage };
