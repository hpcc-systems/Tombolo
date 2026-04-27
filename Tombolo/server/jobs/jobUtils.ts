import logger from '../config/logger.js';
import { parentPort } from 'worker_threads';

type LogOrWorkerMessage =
  | string
  | {
      level?: string;
      [key: string]: unknown;
    };

function logOrPostMessage(input: LogOrWorkerMessage): void {
  try {
    if (parentPort) {
      parentPort.postMessage(input);
      return;
    }

    const level =
      typeof input === 'object' && input !== null ? input.level : undefined;

    switch (level) {
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
