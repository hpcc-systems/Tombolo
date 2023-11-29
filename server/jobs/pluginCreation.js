const { parentPort } = require("worker_threads");

const logger = require("../config/logger");
const models = require("../models");
const application = models.application;
const plugins = models.plugins;

(async () => {
  try {
    //grab all applications so we can have one entry per plugin per application
    const applications = await application.findAll({});

    let pluginList = [];

    //build list of plugins
    applications.map((application) => {
      //for each application, add an object of each plugin, for now we only have orbit

      if (process.env.ASR === "true") {
        pluginList.push({
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

    //create plugins, double checking they don't already exist
    pluginList.map(async (plugin) => {
      let exists = await plugins.findOne({
        where: {
          name: plugin.name,
          application_id: plugin.application_id,
        },
        raw: true,
      });

      console.log(exists);
      console.log("trying to add plugin to " + application.id);

      //if it doesn't exist, create plugin
      if (!exists) {
        plugins.create(plugin);
      }
    });
  } catch (error) {
    logger.error("Failed to create plugins, error: " + error);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();
