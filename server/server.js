const express = require('express');
const app = express();
const tokenService = require('./utils/token_service');

app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const assert = require('assert');

const appRead = require('./routes/app/read');
const fileRead = require('./routes/file/read');
const indexRead = require('./routes/index/read');
/*const integrationRead = require('./routes/integration/read');*/
const hpccRead = require('./routes/hpcc/read');
const userRead = require('./routes/user/read');
const query = require('./routes/query/read');
const job = require('./routes/job/read');
const fileInstance = require('./routes/fileinstance/read');
const consumer = require('./routes/consumers/read');
const ldap = require('./routes/ldap/read');

app.use('/api/app/read', tokenService.verifyToken, appRead);
app.use('/api/file/read', tokenService.verifyToken, fileRead);
app.use('/api/index/read', tokenService.verifyToken, indexRead);

app.use('/api/hpcc/read', tokenService.verifyToken, hpccRead);
app.use('/api/user', userRead);
app.use('/api/query', tokenService.verifyToken, query);
app.use('/api/job', tokenService.verifyToken, job);
app.use('/api/fileinstance', fileInstance);
app.use('/api/consumer', tokenService.verifyToken, consumer);
app.use('/api/ldap', ldap);

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

app.listen(3000, '0.0.0.0', () => console.log('Server listening on port 3000!'));