/* ENV */
const path = require("path");
const fs = require("fs");

const rootENV = path.join(process.cwd(), "..", ".env");
const serverENV = path.join(process.cwd(), ".env");
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
require("dotenv").config({ path: ENVPath });

/* LIBRARIES */
const express = require("express");
const rateLimit = require("express-rate-limit");
const tokenService = require("./utils/token_service");
const passport = require("passport");
const cors = require("cors");
const { sequelize: dbConnection } = require("./models");
const logger = require("./config/logger");

/* BREE JOB SCHEDULER */
const JobScheduler = require("./job-scheduler");

/* Initialize express app */
const app = express();
const port = process.env.PORT || 3000;

/* Initialize Socket IO */
const server = require("http").Server(app);
const socketIo = require("socket.io")(server);
module.exports.io = socketIo;

app.set("trust proxy", 1);

// Limit rate of requests to 400 per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 400,
});

// MIDDLEWARE -> apply to all requests
app.use(cors());
app.use(express.json());
app.use(limiter);
// app.use(morganMiddleware);

if (process.env.APP_AUTH_METHOD === "azure_ad") {
  const bearerStrategy = require("./utils/passportStrategies/passport-azure");
  app.use(passport.initialize()); // For azure SSO
  passport.use(bearerStrategy);
}

/*  ROUTES */
const job = require("./routes/job/read");
const bree = require("./routes/bree/read");
const ldap = require("./routes/ldap/read");
const appRead = require("./routes/app/read");
const query = require("./routes/query/read");
const hpccRead = require("./routes/hpcc/read");
const fileRead = require("./routes/file/read");
const userRead = require("./routes/user/read");
const groups = require("./routes/groups/group");
const indexRead = require("./routes/index/read");
const reportRead = require("./routes/report/read");
const consumer = require("./routes/consumers/read");
const gh_projects = require("./routes/gh_projects");
const propagation = require("./routes/propagation");
const dataflow = require("./routes/dataflows/dataflow");
const constraint = require("./routes/constraint/index");
const fileTemplateRead = require("./routes/fileTemplate/read");
const dataflowGraph = require("./routes/dataflows/dataflowgraph");
const regulations = require("./routes/controlsAndRegulations/read");
const fileMonitoring = require("./routes/filemonitoring/read");
const updateNotifications = require("./routes/notifications/update");
const notifications = require("./routes/notifications/read");
const clustermonitoring = require("./routes/clustermonitoring/read");
const key = require("./routes/key/read");
const api = require("./routes/api/read");
const jobmonitoring = require("./routes/jobmonitoring/read");
const superfileMonitoring = require("./routes/superfilemonitoring/read");
const cluster = require("./routes/cluster/read");
const teamsHook = require("./routes/msTeamsHook/read");
const notification_queue = require("./routes/notification_queue/read");

// Log all HTTP requests
app.use((req, res, next) => {
  logger.http(`[${req.ip}] [${req.method}] [${req.url}]`);
  next();
});

app.use("/api/user", userRead);
app.use("/api/updateNotification", updateNotifications);

//exposed API, requires api key for any routes
app.use("/api/apikeys", api);

// Authenticate token before proceeding to route
app.use(tokenService.verifyToken);

app.use("/api/job", job);
app.use("/api/bree", bree);
app.use("/api/ldap", ldap);
app.use("/api/query", query);
app.use("/api/groups", groups);
app.use("/api/app/read", appRead);
app.use("/api/consumer", consumer);
app.use("/api/dataflow", dataflow);
app.use("/api/propagation", propagation);
app.use("/api/hpcc/read", hpccRead);
app.use("/api/file/read", fileRead);
app.use("/api/index/read", indexRead);
app.use("/api/report/read", reportRead);
app.use("/api/constraint", constraint);
app.use("/api/gh_projects", gh_projects);
app.use("/api/dataflowgraph", dataflowGraph);
app.use("/api/controlsAndRegulations", regulations);
app.use("/api/fileTemplate/read", fileTemplateRead);
app.use("/api/fileMonitoring/read", fileMonitoring);
app.use("/api/notifications/read", notifications);
app.use("/api/superfilemonitoring/read", superfileMonitoring);
app.use("/api/clustermonitoring", clustermonitoring);
app.use("/api/key", key);
app.use("/api/jobmonitoring", jobmonitoring);
app.use("/api/cluster", cluster);
app.use("/api/teamsHook", teamsHook);
app.use("/api/notification_queue", notification_queue);

// Safety net for unhandled errors
app.use((err, req, res, next) => {
  logger.error("Error caught by Express error handler", err);
  res.status(500).send("Something went wrong");
});

// Disables SSL verification for self-signed certificates in development mode 
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = process.env.NODE_ENV === "production" ? 1 : 0;

/* Start server */
server.listen(port, "0.0.0.0", async () => {
  try {
    logger.info("Server listening on port " + port + "!");
    /* Check DB connection */
    await dbConnection.authenticate();
    logger.info("Connection has been established successfully.");
    /* initializing Bree, start status poller, start file monitoring, check for active cron jobs */
    JobScheduler.bootstrap();
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    process.exit(1);
  }
});
