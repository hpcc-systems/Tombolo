import { Logger } from 'winston';

export interface LoggerOptions {
  /**
   * Directory for log files (defaults to './logs')
   */
  logDir?: string;

  /**
   * Log level (defaults to NODE_LOG_LEVEL env or 'info')
   */
  level?: string;

  /**
   * Optional service name to prefix logs
   */
  serviceName?: string;
}

/**
 * Create a logger instance with optional custom configuration
 */
export function createLogger(options?: LoggerOptions): Logger;

/**
 * Default logger instance
 */
export const logger: Logger;
