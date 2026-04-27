import { logger, createLogger } from './logger.js';
import type { Logger } from 'winston';

export { logger, createLogger };
export type { Logger };

export { msGraphClient, extractFirstName } from './msGraph.js';
export type {
  MSGraphUser,
  UserWithManager,
  MSGraphManager,
} from './msGraph.js';
