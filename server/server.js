const express = require('express');
const rateLimit = require("express-rate-limit");
const app = express();
const tokenService = require('./utils/token_service');
const {NotificationModule} = require('./routes/notifications/email-notification');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//apply to all requests
app.use(limiter);

const assert = require('assert');

const appRead = require('./routes/app/read');
const fileRead = require('./routes/file/read');
const indexRead = require('./routes/index/read');
const hpccRead = require('./routes/hpcc/read');
const userRead = require('./routes/user/read');
const query = require('./routes/query/read');
const job = require('./routes/job/read');
const fileInstance = require('./routes/fileinstance/read');
const reportRead = require('./routes/report/read');
const consumer = require('./routes/consumers/read');
const ldap = require('./routes/ldap/read');
const regulations = require('./routes/controlsAndRegulations/read');
const dataflow = require('./routes/dataflows/dataflow');
const dataflowGraph = require('./routes/dataflows/dataflowgraph');
const workflows = require('./routes/workflows/router');
const dataDictionary = require('./routes/data-dictionary/data-dictionary-service');
const groups = require('./routes/groups/group');

app.use('/api/app/read', tokenService.verifyToken, appRead);
app.use('/api/file/read', tokenService.verifyToken, fileRead);
app.use('/api/index/read', tokenService.verifyToken, indexRead);
app.use('/api/hpcc/read', tokenService.verifyToken, hpccRead);
app.use('/api/query', tokenService.verifyToken, query);
app.use('/api/job', tokenService.verifyToken, job);
app.use('/api/fileinstance', tokenService.verifyToken, fileInstance);
app.use('/api/report/read', tokenService.verifyToken, reportRead);
app.use('/api/consumer', tokenService.verifyToken, consumer);
app.use('/api/ldap', ldap);
app.use('/api/controlsAndRegulations', tokenService.verifyToken, regulations);
app.use('/api/dataflowgraph', tokenService.verifyToken, dataflowGraph);
app.use('/api/dataflow', tokenService.verifyToken, dataflow);
app.use('/api/workflows', tokenService.verifyToken, workflows);
app.use('/api/data-dictionary', tokenService.verifyToken, dataDictionary);
app.use('/api/user', userRead);
app.use('/api/groups', tokenService.verifyToken, groups);

//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

app.listen(3000, '0.0.0.0', () => console.log('Server listening on port 3000!'));