const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file'); // Ensure you have this package installed
const util = require('util');

// Determine if the environment is production
const isProduction = process.env.NODE_ENV === 'production';

// Define custom colors for different log levels
format.colorize().addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
});

// Function to configure log format based on the environment
const getFormat = isConsole =>
  format.combine(
    // Always include a timestamp and log in JSON format for easy parsing
    format.timestamp(),
    format.errors({ stack: true }), // Handle error objects properly
    format.printf(info => {
      // Start with the base message
      let message = info.message;

      // Handle additional arguments passed to the logger
      const args = Array.prototype.slice.call(arguments, 1);
      if (info[Symbol.for('splat')]) {
        const additionalArgs = info[Symbol.for('splat')];
        const formattedArgs = additionalArgs.map(arg => {
          if (typeof arg === 'string') {
            return arg;
          } else if (typeof arg === 'object' && arg !== null) {
            if (arg instanceof Error) {
              return isProduction
                ? JSON.stringify(
                    {
                      name: arg.name,
                      message: arg.message,
                      stack: arg.stack,
                    },
                    null,
                    2
                  )
                : util.inspect(arg, { depth: null, colors: isConsole });
            }
            return isProduction
              ? JSON.stringify(arg, null, 2)
              : util.inspect(arg, { depth: null, colors: isConsole });
          }
          return String(arg);
        });

        if (formattedArgs.length > 0) {
          message += ' ' + formattedArgs.join(' ');
        }
      }

      // Construct the log object for metadata
      const logEntry = { ...info };

      // Remove standard fields and symbols
      delete logEntry.level;
      delete logEntry.message;
      delete logEntry.timestamp;
      delete logEntry[Symbol.for('splat')];
      delete logEntry[Symbol.for('level')];
      delete logEntry[Symbol.for('message')];

      // If in production, return as JSON with full object serialization
      if (isProduction) {
        const logOutput = {
          level: info.level,
          message: message,
          timestamp: info.timestamp,
        };

        // Add any additional metadata
        if (Object.keys(logEntry).length > 0) {
          logOutput.metadata = logEntry;
        }

        return JSON.stringify(logOutput, null, 2);
      }

      // Use a friendly format for development
      const metaString = Object.keys(logEntry).length
        ? ` ${util.inspect(logEntry, { depth: null, colors: isConsole })}`
        : '';

      return `[${new Date(info.timestamp).toLocaleString()}]-[${info.level}] ${message}${metaString}`;
    })
  );

// Create a logger instance
const logger = createLogger({
  exitOnError: false, // Do not exit on handled exceptions
  format: getFormat(false), // Set the default log format (for file transports)
  transports: [
    // Console transport for logging to the console
    new transports.Console({
      level: process.env.NODE_LOG_LEVEL || 'info', // Log level from environment or default to 'info'
      format: format.combine(format.colorize({ all: true }), getFormat(true)),
    }),
    // Combined log transport
    new transports.DailyRotateFile({
      level: 'verbose',
      filename: './logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m', // Maximum size
      maxFiles: '14d', // Maximum of 14 days
      format: getFormat(false), // Use plain format for files
    }),
  ],
});

// Daily rotate file transport for logging errors
logger.add(
  new transports.DailyRotateFile({
    level: 'error',
    filename: './logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true, // Compress log files
    maxSize: '20m', // Maximum size of a log file
    maxFiles: '14d', // Keep logs for a maximum of 14 days
    format: getFormat(false), // Use plain format for files
  })
);

// Export the logger instance for use in other modules
module.exports = logger;
