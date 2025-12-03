const path = require('path');
const fs = require('fs');

const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
require('dotenv').config({ path: ENVPath });
const { preloadSecrets } = require('./config/secrets');

/* Use UTC as default timezone */
process.env.TZ = 'UTC';

/* LIBRARIES */
const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  tokenValidationMiddleware: validateToken,
} = require('./middlewares/tokenValidationMiddleware');

const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const { sequelize: dbConnection } = require('./models');

const logger = require('./config/logger');
require('./utils/tokenBlackListing');

const cookieParser = require('cookie-parser');

// const { doubleCsrfProtection } = require('./middlewares/csrfMiddleware');

const { readSelfSignedCerts } = require('./utils/readSelfSignedCerts');
const { sendError } = require('./utils/response');

/* BREE JOB SCHEDULER */
const JobScheduler = require('./jobSchedular/job-scheduler');

readSelfSignedCerts();

/* Initialize express app */
const app = express();
const port = process.env.SERVER_PORT || 3001;

// Log all requests
app.disable('etag'); // Don't send etags so that the client does not cache the response
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.http(
      `[${req.ip}] [${req.method}] [${req.baseUrl}] [${res.statusCode}]`
    );
  });
  next();
});

const server = require('http').Server(app);
server.maxHeadersCount = 1000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

const sockets = new Set();
server.on('connection', socket => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});

app.set('trust proxy', 1);

// Limit the rate of requests to 400 per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.isNaN(parseInt(process.env.RATE_LIMIT_REQUEST_MAX, 10))
    ? 400
    : parseInt(process.env.RATE_LIMIT_REQUEST_MAX, 10),
});

// MIDDLEWARE -> apply to all requests
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(cookieParser());

/*  ROUTES */
const bree = require('./routes/bree/read');
const applications = require('./routes/applicationRoutes');
const hpccRead = require('./routes/hpccRoutes');
const jobmonitoring = require('./routes/jobMonitoringRoutes');
const configurations = require('./routes/configRoutes');
const orbit = require('./routes/orbit/read');
const integrations = require('./routes/integrations/read');
const notification_queue = require('./routes/notificationQueueRoutes');
const sent_notifications = require('./routes/sentNotificationRoutes');
const monitorings = require('./routes/monitoringTypeRoutes');
const asr = require('./routes/asrRoutes');
const wizard = require('./routes/wizardRoutes');

//MVC & TESTED
const auth = require('./routes/authRoutes');
const users = require('./routes/userRoutes');
const sessions = require('./routes/sessionRoutes');
const cluster = require('./routes/clusterRoutes');
const roles = require('./routes/roleTypesRoute');
const status = require('./routes/statusRoutes');
const instanceSettings = require('./routes/instanceRoutes');
const costMonitoring = require('./routes/costMonitoringRoutes');
const landingZoneMonitoring = require('./routes/landingZoneMonitoring');
const clusterMonitoring = require('./routes/clusterMonitoringRoutes');
const fileMonitoring = require('./routes/fileMonitoringRoutes');
const orbitProfileMonitoring = require('./routes/orbitProfileMonitoringRoutes');
const workunits = require('./routes/workunitRoutes');

// Use compression to reduce the size of the response body and increase the speed of a web application
app.use(compression());

app.use('/api/auth', auth);
app.use('/api/status', status);
app.use('/api/wizard', wizard);

// Validate access token and csrf tokens, all routes below require these
app.use(validateToken);
// app.use(doubleCsrfProtection);

// Authenticated routes
app.use('/api/user', users);
app.use('/api/session', sessions);
app.use('/api/bree', bree);
app.use('/api/app/read', applications);
app.use('/api/hpcc/read', hpccRead);
app.use('/api/fileMonitoring', fileMonitoring);
app.use('/api/jobmonitoring', jobmonitoring);
app.use('/api/cluster', cluster);
app.use('/api/configurations', configurations);
app.use('/api/orbit', orbit);
app.use('/api/integrations', integrations);
app.use('/api/notification_queue', notification_queue);
app.use('/api/sent_notifications', sent_notifications);
app.use('/api/monitorings', monitorings);
app.use('/api/asr', asr);
app.use('/api/roles', roles);
app.use('/api/instanceSettings', instanceSettings);
app.use('/api/costMonitoring', costMonitoring);
app.use('/api/landingZoneMonitoring', landingZoneMonitoring);
app.use('/api/clusterMonitoring', clusterMonitoring);
app.use('/api/orbitProfileMonitoring', orbitProfileMonitoring);
app.use('/api/workunits', workunits);

// Safety net for unhandled errors
app.use((err, req, res, next) => {
  logger.error(
    `Error caught by Express error handler on route ${req.path}`,
    err
  );
  return sendError(res, 'Something went wrong', 500);
});

// Disables SSL verification for self-signed certificates in development mode
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] =
  process.env.NODE_ENV === 'production' ? 1 : 0;

// Attach graceful shutdown handlers
const setupGracefulShutdown = require('./utils/setupGracefulShutdown');
setupGracefulShutdown({ server, sockets, dbConnection, JobScheduler });

/* Start server */
server.listen(port, '0.0.0.0', async () => {
  try {
    logger.info('-----------------------------');
    logger.info('Server is initializing...');
    logger.info('-----------------------------');

    // Preload secrets before DB connection and server start
    await preloadSecrets();
    logger.info('Secrets loaded from Akeyless or .env');

    logger.info('Server listening on port ' + port + '!');
    /* Check DB connection */
    await dbConnection.authenticate();
    logger.info('Connection has been established successfully.');
    /* initializing Bree, start status poller, start file monitoring, check for active cron jobs */
    JobScheduler.bootstrap();
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
});
