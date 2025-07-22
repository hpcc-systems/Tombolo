const path = require('path');
const pathToEnv = path.join(process.cwd(), '..', '..', '.env');
require('dotenv').config({ path: pathToEnv });
const express = require('express');
// const db = require('../models');
const logger = require('../config/logger');
const cookieParser = require('cookie-parser');
const { fakeValidateTokenMiddleware } = require('./helpers');

// Change the NODE_ENV to test
process.env.NODE_ENV = 'test';

const app = express();
const port = process.env.TEST_SERVER_PORT;

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Import routes
const auth = require('../routes/authRoutes');
const user = require('../routes/userRoutes');
const instance = require('../routes/instanceRoutes');
const cluster = require('../routes/clusterRoutes');
const session = require('../routes/sessionRoutes');
const roles = require('../routes/roleTypesRoute');
const landingZoneMonitoring = require('../routes/landingZoneMonitoring');
const costMonitoring = require('../routes/costMonitoringRoutes');

// Use routes
app.use('/api/auth', auth);
app.use('/api/users', fakeValidateTokenMiddleware, user);
app.use('/api/instance', instance);
app.use('/api/cluster', cluster);
app.use('/api/session', session);
app.use('/api/roles', roles);
app.use(
  '/api/landingZoneMonitoring',
  fakeValidateTokenMiddleware,
  landingZoneMonitoring
);
app.use('/api/costMonitoring', fakeValidateTokenMiddleware, costMonitoring);

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
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, closeServer };
