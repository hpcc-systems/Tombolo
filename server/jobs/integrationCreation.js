const { parentPort } = require("worker_threads");

const logger = require("../config/logger");
const models = require("../models");
const application = models.application;
const integrations = models.integrations;

async function createIntegrations() {
  try {
    //grab all applications so we can have one entry per integration per application
    const applications = await application.findAll({});

    let integrationList = [];

    //build list of integrations
    applications.map((application) => {
      //for each application, add an object of each integration, for now we only have orbit

      if (process.env.ASR === "true") {
        integrationList.push({
          application_id: application.id,
          name: "ASR",
          description:
            "Enabling this integration will allow Tombolo to collect data from Orbit, FIDO, and other ASR sources in order to provide monitoring and alerting functionality. Additional fields will be made available in certain monitoring types as well.",
          active: "false",
          metaData: {
            notificationEmails: "",
            notificationWebhooks: "",
          },
        });
      }
    });

    await Promise.all(
      //create integrations, double checking they don't already exist
      integrationList.map(async (integration) => {
        let exists = await integrations.findOne({
          where: {
            name: integration.name,
            application_id: integration.application_id,
          },
          raw: true,
        });

        //if it doesn't exist, create integration
        if (!exists) {
          await integrations.create(integration);
        }
        return true;
      })
    );
  } catch (error) {
    logger.error("Failed to create integrations, error: " + error);
  } finally {
    if (parentPort) parentPort.postMessage("done");
  }
}

module.exports = { createIntegrations };
