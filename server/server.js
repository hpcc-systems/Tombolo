require('dotenv').config();
const express = require('express');
const rateLimit = require("express-rate-limit");
const app = express();
const {verifyUserToken} = require('./utils/token_service');
const {verifyToken} = require("./routes/user/userservice")
const jwt = require('jsonwebtoken');
const {NotificationModule} = require('./routes/notifications/email-notification');
const passport = require('passport');
const BearerStrategy = require('passport-azure-ad').BearerStrategy;
const {options} = require("./config/azureConfig")

// Socket
const server = require('http').Server(app);
const io = require('socket.io')(server);

const socketIo = io.use(function(socket, next){
  const token =  socket.handshake.auth.token;
  // verifyToken(token).then(() => {
  //   next();
  // })
})

exports.socketIo = socketIo;

app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400 // limit each IP to 400 requests per windowMs
});

app.use(express.json());
app.use(function(req, res, next) {
  //res.header("Access-Control-Allow-Origin", "*");
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//apply to all requests
app.use(limiter);

const bearerStrategy = new BearerStrategy(options, (token, done) => {
  // Send user info using the second argument
  done(null, {id: 12}, token);
});

// This will initialize the passport object on every request
app.use(passport.initialize());
passport.use(bearerStrategy);

const QueueDaemon = require('./queue-daemon');
const JobScheduler = require('./job-scheduler');
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


app.use('/api/app/read',verifyUserToken,   appRead);
app.use('/api/file/read', verifyUserToken,  fileRead);
app.use('/api/index/read', verifyUserToken,  indexRead);
app.use('/api/hpcc/read', verifyUserToken,  hpccRead);
app.use('/api/query', verifyUserToken,  query);
app.use('/api/job', verifyUserToken,  job);
app.use('/api/fileinstance', verifyUserToken,  fileInstance);
app.use('/api/report/read', verifyUserToken,  reportRead);
app.use('/api/consumer', verifyUserToken,  consumer);
app.use('/api/ldap', ldap);
app.use('/api/controlsAndRegulations', verifyUserToken,  regulations);
app.use('/api/dataflowgraph', verifyUserToken,  dataflowGraph);
app.use('/api/dataflow', verifyUserToken,  dataflow);

app.use('/api/workflows', verifyUserToken,  workflows);
app.use('/api/data-dictionary', verifyUserToken,  dataDictionary);
app.use('/api/user', userRead);
app.use('/api/groups', verifyUserToken,  groups);

//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
server.listen(3000, '0.0.0.0', () => console.log('Server listening on port 3000!'));