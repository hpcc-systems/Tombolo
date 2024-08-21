const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file"); // Ensure you have this package installed

// Determine if the environment is production
const isProduction = process.env.NODE_ENV === "production";

// Define custom colors for different log levels
format.colorize().addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
});

// Function to configure log format based on the environment
const getFormat = (isConsole) =>
  format.combine(
    // Always include a timestamp and log in JSON format for easy parsing
    format.timestamp(),
    isConsole ? format.colorize({ all: true }) : format.uncolorize(),
    format.printf((info) => {
      // Construct the log object
      const logEntry = {
        level: info.level,
        message: info.message,
        timestamp: info.timestamp,
      };

      // If in production, return as JSON
      if (isProduction) {
        return JSON.stringify(logEntry);
      }

      // Use a friendly format for development
      return `[${new Date(info.timestamp).toLocaleString()}]-[${info.level}] ${
        info.message
      }`;
    })
  );

// Create a logger instance
const logger = createLogger({
  exitOnError: false, // Do not exit on handled exceptions
  format: getFormat(false), // Set the default log format (for file transports)
  transports: [
    // Console transport for logging to the console
    new transports.Console({
      level: process.env.NODE_LOG_LEVEL || "info", // Log level from environment or default to 'info'
      format: getFormat(true), // Set the log format for console (colorized)
    }),
    // Combined log transport
    new transports.DailyRotateFile({
      level: "verbose",
      filename: "./logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m", // Maximum size
      maxFiles: "14d", // Maximum of 14 days
      format: getFormat(false), // Use plain format for files
    }),
  ],
});

// Additional file transports for development environment
if (!isProduction) {
  // Daily rotate file transport for logging errors
  logger.add(
    new transports.DailyRotateFile({
      level: "error",
      filename: "./logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true, // Compress log files
      maxSize: "20m", // Maximum size of a log file
      maxFiles: "14d", // Keep logs for a maximum of 14 days
      format: getFormat(false), // Use plain format for files
    })
  );
}

// Export the logger instance for use in other modules
module.exports = logger;