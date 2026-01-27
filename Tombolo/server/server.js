import path from 'path';
import fs from 'fs';

const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
import dotenv from 'dotenv';
dotenv.config({ path: ENVPath });
import { preloadSecrets } from './config/secrets.js';

/* Use UTC as default timezone */
process.env.TZ = 'UTC';

/* LIBRARIES */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { tokenValidationMiddleware as validateToken } from './middlewares/tokenValidationMiddleware.js';

import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { sequelize as dbConnection } from './models/index.js';

import logger from './config/logger.js';
import './utils/tokenBlackListing.js';

import cookieParser from 'cookie-parser';

import { doubleCsrfProtection } from './middlewares/csrfMiddleware.js';

import { readSelfSignedCerts } from './utils/readSelfSignedCerts.js';
import { sendError } from './utils/response.js';

/* BREE JOB SCHEDULER */
import JobScheduler from './jobSchedular/job-scheduler.js';

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

import http from 'http';
const server = http.createServer(app);
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
import bree from './routes/bree/read.js';
import applications from './routes/applicationRoutes.js';
import hpccRead from './routes/hpccRoutes.js';
import jobmonitoring from './routes/jobMonitoringRoutes.js';
import configurations from './routes/configRoutes.js';
import orbit from './routes/orbit/read.js';
import integrations from './routes/integrations/read.js';
import notification_queue from './routes/notificationQueueRoutes.js';
import sent_notifications from './routes/sentNotificationRoutes.js';
import monitorings from './routes/monitoringTypeRoutes.js';
import asr from './routes/asrRoutes.js';
import wizard from './routes/wizardRoutes.js';

//MVC & TESTED
import auth from './routes/authRoutes.js';
import users from './routes/userRoutes.js';
import sessions from './routes/sessionRoutes.js';
import cluster from './routes/clusterRoutes.js';
import roles from './routes/roleTypesRoute.js';
import status from './routes/statusRoutes.js';
import instanceSettings from './routes/instanceRoutes.js';
import costMonitoring from './routes/costMonitoringRoutes.js';
import landingZoneMonitoring from './routes/landingZoneMonitoring.js';
import clusterMonitoring from './routes/clusterMonitoringRoutes.js';
import fileMonitoring from './routes/fileMonitoringRoutes.js';
import orbitProfileMonitoring from './routes/orbitProfileMonitoringRoutes.js';
import workunits from './routes/workunitRoutes.js';

// Use compression to reduce the size of the response body and increase the speed of a web application
app.use(compression());

app.use('/api/auth', auth);
app.use('/api/status', status);
app.use('/api/wizard', wizard);

// Validate access token and csrf tokens, all routes below require these
app.use(validateToken);
app.use(doubleCsrfProtection);

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
app.use((err, req, res) => {
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
import setupGracefulShutdown from './utils/setupGracefulShutdown.js';
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
