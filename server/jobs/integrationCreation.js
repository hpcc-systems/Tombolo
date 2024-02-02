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
          name: "Orbit",
          description:
            "Enabling this integration will allow Tombolo to collect data from HPCCs Orbit system and provide dashboard information for it",
          active: "false",
          metaData: {
            notificationEmails: "matthew.fancher@lexisnexisrisk.com",
            notificationWebhooks:
              "https://reedelsevier.webhook.office.com/webhookb2/81c072d6-6b47-4eca-9434-73944c464876@9274ee3f-9425-4109-a27f-9fb15c10675d/IncomingWebhook/60019c7653734064b4c225a02b1da597/af40e12f-e839-4801-91e9-e61a20045feb",
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
