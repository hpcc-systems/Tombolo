import path from 'path';
const pathToEnv = path.join(process.cwd(), '..', '..', '.env');
import dotenv from 'dotenv';
dotenv.config({ path: pathToEnv });
import express from 'express';
// import db from '../models/index.js';
import logger from '../config/logger.js';
import cookieParser from 'cookie-parser';
import { fakeValidateTokenMiddleware } from './helpers.js';

// Change the NODE_ENV to test
process.env.NODE_ENV = 'test';

const app = express();
const port = process.env.TEST_SERVER_PORT || 3004;

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Import routes
import auth from '../routes/authRoutes.js';
import user from '../routes/userRoutes.js';
import instance from '../routes/instanceRoutes.js';
import cluster from '../routes/clusterRoutes.js';
import session from '../routes/sessionRoutes.js';
import roles from '../routes/roleTypesRoute.js';
import landingZoneMonitoring from '../routes/landingZoneMonitoring.js';
import costMonitoring from '../routes/costMonitoringRoutes.js';
import clusterMonitoring from '../routes/clusterMonitoringRoutes.js';
import fileMonitoring from '../routes/fileMonitoringRoutes.js';
import orbitProfileMonitoring from '../routes/orbitProfileMonitoringRoutes.js';
import workunits from '../routes/workunitRoutes.js';

// Use routes
app.use('/api/auth', auth);
app.use('/api/users', fakeValidateTokenMiddleware, user);
app.use('/api/instance', instance);
app.use('/api/cluster', fakeValidateTokenMiddleware, cluster);
app.use('/api/session', session);
app.use('/api/roles', roles);
app.use(
  '/api/landingZoneMonitoring',
  fakeValidateTokenMiddleware,
  landingZoneMonitoring
);
app.use(
  '/api/clusterMonitoring',
  fakeValidateTokenMiddleware,
  clusterMonitoring
);
app.use('/api/costMonitoring', fakeValidateTokenMiddleware, costMonitoring);
app.use('/api/fileMonitoring', fakeValidateTokenMiddleware, fileMonitoring);
app.use(
  '/api/orbitProfileMonitoring',
  fakeValidateTokenMiddleware,
  orbitProfileMonitoring
);
app.use('/api/workunits', fakeValidateTokenMiddleware, workunits);

// Function to start the server
let server;
const startServer = async () => {
  try {
    // await db.sequelize.authenticate();
    server = app.listen(port);
  } catch (err) {
    logger.error('Failed to establish connection to test DB', err);
  }
};

// Function to close the server
const closeServer = () => {
  if (server) {
    server.close();
  }
};

// Start the server if this file is run directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  startServer();
}

export { app, startServer, closeServer };
