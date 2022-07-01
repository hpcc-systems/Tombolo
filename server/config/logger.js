const { createLogger, format, transports } = require('winston');
// docs: https://github.com/winstonjs/winston
const isProduction = process.env.NODE_ENV === 'production';

const getFormat = () =>
  format.combine(
    isProduction ? format.uncolorize() : format.colorize({ all: true }),  // adding or removing colors depending on logs type;
    format.timestamp(), // will add UTC timestamp to logs, not enabled by default
    format.printf((info) => {
      let { level, message, label, stack, timestamp } = info;
      if (!isProduction) timestamp = new Date(timestamp).toLocaleString(); // will make timestemp more friendly in development
      let devlog = `[${timestamp}]-[${level}] ${message}`; // will produce : [5/12/2022, 10:21:41 AM]-[info] ✔️ JOBSCHEDULER IS BOOTSTRAPED
      let prodlog = `[${level}] ${message}`; // Azure adds its own timestemp to log so we dont need to put it into console twice
      let log = isProduction ? prodlog : devlog;
      if (stack) log += `\n ${stack}`; // stack is only available when error is logged, print in on new line
      return log;
    })
  );

const common = { handleExceptions: true, handleRejections: true }; // we want to catch any errors on promise rejections and add them to logs

let DEFAULT_LOG_LEVEL = 'http';
//! Changing to 'debug' will bring sequelize logs to console;
// when in productions log into console everything up to PROD_LEVEL level. https://github.com/winstonjs/winston#logging-levels
// error  0 | warn  1 | info  2 | http  3 | verbose  4 | debug  5 | silly  6 |

// Initialize logger
const logger = createLogger({
  exitOnError: false,
  format: format.combine(format.errors({ stack: true }), format.timestamp()), // this will be common setting for all transports;
  transports: [
     new transports.Console({
      ...common,
      format: getFormat(),
      level: process.env.NODE_LOG_LEVEL || DEFAULT_LOG_LEVEL
    }) 
  ],
});

// If we're not in production then also log to the files
// if (process.env.NODE_ENV !== 'production') {
//   const settings = {...common, format: getFormat()}; // will write to files same output as to console but no special char for coloring
//   logger.add(new transports.File({ ...settings, level: 'http', filename: './logs/combined.log' }));
//   logger.add(new transports.File({ ...settings, level: 'error', filename: './logs/error.log' })); // only logger.error() will be written here
// }

module.exports = logger;