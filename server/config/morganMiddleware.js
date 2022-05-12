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

morgan.token('URL', (req) => {
  const url = req.originalUrl || req.url;
  const beforeQuery = url.split('?')[0]
  return beforeQuery;
})

morgan.token('query', (req) => {
  if (Object.keys(req.query).length > 0 ){
    return `\n query: ${JSON.stringify(req.query)}`
  }
  return '';
})

//  tokens : https://github.com/expressjs/morgan#tokens 
//  Log ex:
//  [5/12/2022, 4:40:57 PM]-[http] [GET]-[304] /api/groups/assets | <username> | <ip address> | [42ms] 
//  query: {"app_id":"2225cd7e-0d69-48a2-977d-8a9fcd744491","group_id":"2"}
const morganMiddleware = morgan( "[:method]-[:status] :URL | :user | :remote-addr | [:response-time[digits]ms] :query", { stream , skip } );

module.exports = morganMiddleware;