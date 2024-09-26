const path = require("path");
const pathToEnv = path.join(process.cwd(), "..", "..", ".env");
require("dotenv").config({ path: pathToEnv });
const express = require("express");
const db = require("../models");
const logger = require("../config/logger");

// Change the NODE_ENV to test
process.env.NODE_ENV = "test";

const app = express();
const port = process.env.TEST_SERVER_PORT;

// Middlewares
app.use(express.json());

// Import routes
const auth = require("../routes/authRoutes");
const user = require("../routes/userRoutes");
const cluster = require("../routes/clusterRoutes");


// Use routes
app.use("/api/auth", auth);
app.use("/api/users", user);
app.use("/api/cluster", cluster);


// Function to start the server
let server;
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    server = app.listen(port);
  } catch (err) {
    logger.error("Failed to establish connection to test DB", err);
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

module.exports = { app, db, startServer, closeServer };
