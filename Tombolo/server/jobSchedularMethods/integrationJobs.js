const path = require("path");
const logger = require("../config/logger");

const INTEGRATION_CREATION = "integrationCreation.js";

async function createIntegrationCreationJob() {
  const uniqueJobName = `Integration Creation Job`;
  const job = {
    interval: "60s",
    name: uniqueJobName,
    path: path.join(__dirname, "..", "jobs", INTEGRATION_CREATION),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info("📈 INTEGRATION CREATION JOB STARTED ...");
}

module.exports = {
  createIntegrationCreationJob,
};
