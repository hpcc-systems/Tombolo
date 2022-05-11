/* LIBRARIES */
const express = require('express');
const rateLimit = require("express-rate-limit");
const tokenService = require('./utils/token_service');
const passport = require('passport');
const bearerStrategy = require('./utils/passportStrategies/passport-azure');
const cors = require('cors');
const { sequelize: dbConnection } = require('./models');

/* BREE JOB SCHEDULER */
const JobScheduler = require('./job-scheduler');

/* Initialize express app */
const app = express();
const port = process.env.PORT || 3000

/* Initialize Socket IO */
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

/*  ROUTES */
const job = require('./routes/job/read');
const ldap = require('./routes/ldap/read');
const appRead = require('./routes/app/read');
const query = require('./routes/query/read');
const hpccRead = require('./routes/hpcc/read');
const fileRead = require('./routes/file/read');
const userRead = require('./routes/user/read');
const groups = require('./routes/groups/group');
const indexRead = require('./routes/index/read');
const reportRead = require('./routes/report/read');
const consumer = require('./routes/consumers/read');
const gh_projects = require('./routes/gh_projects');
const dataflow = require('./routes/dataflows/dataflow');
const fileTemplateRead = require('./routes/fileTemplate/read')
const dataflowGraph = require('./routes/dataflows/dataflowgraph');
const regulations = require('./routes/controlsAndRegulations/read');

app.use('/api/user', userRead);
// Authenticate token before proceeding to route
app.use(tokenService.verifyToken);

app.use('/api/job', job);
app.use('/api/ldap', ldap);
app.use('/api/query', query);
app.use('/api/groups', groups);
app.use('/api/app/read', appRead);
app.use('/api/consumer', consumer);
app.use('/api/dataflow', dataflow);
app.use('/api/hpcc/read', hpccRead);
app.use('/api/file/read', fileRead);
app.use('/api/index/read', indexRead);
app.use('/api/report/read', reportRead);
app.use('/api/gh_projects', gh_projects);
app.use('/api/dataflowgraph', dataflowGraph);
app.use('/api/controlsAndRegulations', regulations);
app.use('/api/fileTemplate/read', fileTemplateRead);

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

/* Start server */
server.listen(port, '0.0.0.0', async () => {
  try {
    console.log('Server listening on port '+port+'!')
    /* Check DB connection */
    await dbConnection.authenticate();
    console.log('Connection has been established successfully.');
    /* initializing Bree, start status poller, start file monitoring, check for active cron jobs */
    JobScheduler.bootstrap(); 
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1)
  }
});
