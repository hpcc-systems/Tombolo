const express = require('express');
const rateLimit = require("express-rate-limit");
const tokenService = require('./utils/token_service');
const passport = require('passport');
const cors = require('cors');

//Initialize express app
const app = express();
const port = process.env.PORT || 3000

// Azure setup
const BearerStrategy = require('passport-azure-ad').BearerStrategy;
const {options} = require("./config/azureConfig")
const bearerStrategy = new BearerStrategy(options, (profile, done) => {
      done(null, {}, profile);
});

// Socket IO
const server = require('http').Server(app);
const socketIo = require('socket.io')(server);
exports.io = socketIo;

app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400 // limit each IP to 400 requests per windowMs
});

// MIDDLEWARE -> apply to all requests
app.use(cors());
app.use(express.json());
app.use(limiter);
if(process.env.APP_AUTH_METHOD==='azure_ad'){
  app.use(passport.initialize()); // For azure SSO
  passport.use(bearerStrategy);
}

const JobScheduler = require('./job-scheduler');
JobScheduler.bootstrap(); // initializing Bree, starting status poller and checking for active cron jobs.

const appRead = require('./routes/app/read');
const fileRead = require('./routes/file/read');
const fileTemplateRead = require('./routes/fileTemplate/read')
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
const ghCredentials = require('./routes/ghCredentials');
const gh_projects = require('./routes/gh_projects');

app.use('/api/app/read', tokenService.verifyToken, appRead);
app.use('/api/file/read', tokenService.verifyToken, fileRead);
app.use('/api/fileTemplate/read', tokenService.verifyToken, fileTemplateRead);
app.use('/api/index/read', tokenService.verifyToken, indexRead);
app.use('/api/hpcc/read', tokenService.verifyToken, hpccRead);
app.use('/api/query', tokenService.verifyToken, query);
app.use('/api/job',  job);
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
app.use('/api/ghcredentials', tokenService.verifyToken, ghCredentials);
app.use('/api/gh_projects', tokenService.verifyToken, gh_projects);


// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

server.listen(port, '0.0.0.0', () => console.log('Server listening on port '+port+'!'));