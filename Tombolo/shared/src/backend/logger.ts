import {
  format,
  transports,
  createLogger as winstonCreateLogger,
  Logger,
} from 'winston';
import 'winston-daily-rotate-file';
import util from 'util';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// Configure custom colors
format.colorize().addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
});

/**
 * Format an argument for logging based on its type
 * @param arg - The argument to format
 * @param isConsole - Whether this is for console output
 * @returns The formatted argument as a string
 */
function formatArgument(arg: any, isConsole: boolean): string {
  if (typeof arg === 'string') {
    return arg;
  }

  if (typeof arg === 'object' && arg !== null) {
    if (arg instanceof Error) {
      if (isProduction)
        return JSON.stringify(
          { name: arg.name, message: arg.message, stack: arg.stack },
          null,
          2
        );
      return arg.stack || '';
    }

    return isProduction
      ? JSON.stringify(arg, null, 2)
      : util.inspect(arg, { depth: null, colors: isConsole });
  }

  return String(arg);
}

/**
 * Clean log entry metadata by removing standard fields and symbols
 * @param info - The winston log info object
 * @returns The cleaned log entry without standard fields
 */
function cleanLogEntry(info: any): Record<string, any> {
  const logEntry = { ...info };

  // Remove standard fields and symbols
  delete logEntry.level;
  delete logEntry.message;
  delete logEntry.timestamp;
  delete logEntry.stack;
  delete logEntry[Symbol.for('splat')];
  delete logEntry[Symbol.for('level')];
  delete logEntry[Symbol.for('message')];

  return logEntry;
}

function formatProductionLog(
  info: any,
  message: string,
  logEntry: Record<string, any>
): string {
  const logOutput: Record<string, any> = {
    level: info.level,
    message: message,
    timestamp: info.timestamp,
  };

  if (Object.keys(logEntry).length > 0) {
    logOutput.metadata = logEntry;
  }

  return JSON.stringify(logOutput, null, 2);
}

/**
 * Format log output for development environment
 * @param info - The winston log info object
 * @param message - The formatted message
 * @param logEntry - The cleaned log entry metadata
 * @param isConsole - Whether this is for console output
 * @returns Human-readable log string for development
 */
function formatDevelopmentLog(
  info: any,
  message: string,
  logEntry: Record<string, any>,
  isConsole: boolean
): string {
  const metaString = Object.keys(logEntry).length
    ? ` ${util.inspect(logEntry, { depth: null, colors: isConsole })}`
    : '';

  return `[${new Date(info.timestamp).toLocaleString()}]-[${info.level}] ${message}${metaString}`;
}

/**
 * Create a winston format function for logging
 */
function createLogFormat(isConsole: boolean) {
  return format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf((info: any) => {
      let message: string = info.message;

      // Handle additional arguments
      if (info[Symbol.for('splat')]) {
        const additionalArgs: any[] = info[Symbol.for('splat')];
        const formattedArgs = additionalArgs.map((arg: any) =>
          formatArgument(arg, isConsole)
        );

        if (formattedArgs.length > 0) {
          message += ' ' + formattedArgs.join(' ');
        }
      }

      const logEntry = cleanLogEntry(info);

      return isProduction
        ? formatProductionLog(info, message, logEntry)
        : formatDevelopmentLog(info, message, logEntry, isConsole);
    })
  );
}

export interface LoggerOptions {
  logDir?: string;
  level?: string;
}

/**
 * Create a logger instance with optional custom configuration
 * @param options - Logger configuration options
 * @param options.logDir - Directory for log files (defaults to './logs')
 * @param options.level - Log level (defaults to NODE_LOG_LEVEL env or 'info')
 * @returns Winston logger instance
 */
function createLoggerInstance(options: LoggerOptions = {}): Logger {
  const { logDir = './logs', level = process.env.NODE_LOG_LEVEL || 'info' } =
    options;

  // Create transports
  const consoleTransport = new transports.Console({
    level,
    format: format.combine(
      format.colorize({ all: true }),
      createLogFormat(true)
    ),
  });

  const combinedFileTransport = new transports.DailyRotateFile({
    level: 'verbose',
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: createLogFormat(false),
  });

  const errorFileTransport = new transports.DailyRotateFile({
    level: 'error',
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: createLogFormat(false),
  });

  // Create and configure logger
  const logger = winstonCreateLogger({
    exitOnError: false,
    format: createLogFormat(false),
    transports: [consoleTransport, combinedFileTransport, errorFileTransport],
  });

  return logger;
}

// Export factory function and default instance
export const createLogger = createLoggerInstance;
export const logger = createLoggerInstance(); // Default logger instance
