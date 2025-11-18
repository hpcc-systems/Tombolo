import type { Logger } from 'winston';

export interface LoggerOptions {
  logDir?: string;
  level?: string;
}

export function createLogger(options?: LoggerOptions): Logger;
export const logger: Logger;
