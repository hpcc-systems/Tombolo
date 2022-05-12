const morgan = require("morgan");
const logger = require("./logger");


// Docs: https://github.com/expressjs/morgan
const stream = {
  write: (message) => logger.http(message.trim()), // Use the http level to have logs available in prod and dev
};

const skip = (req, res) => { 
  const url = req.originalUrl || req.url;
  if (url.includes('/api/dataflowgraph/save')) return true; // do not log graph changes route
  if (url.includes('/api/job/jobExecutionDetails')) return true; // do not log graph jobExecutionDetails polling
  return false;
};

morgan.token('user', (req) => {
  return req.authInfo?.name || req.user?.email || 'unknown user'
})

// tokens : https://github.com/expressjs/morgan#tokens
// ex. [1679ms]-[GET]-/api/file/read/file_list?application_id=2225cd7e-0d69-48a2-977d-8a9fcd744491 | 127.0.0.1 | Agapov, Kostiantyn (RIS-HBE)
const morganMiddleware = morgan( "[:response-time[digits]ms]-[:method]-:url | :remote-addr | :user", { stream , skip } );

module.exports = morganMiddleware;