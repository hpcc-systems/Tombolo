const models = require("../../models");
const plugins = models.plugins;
let application = models.application;
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const rootENV = path.join(process.cwd(), "..", ".env");
const serverENV = path.join(process.cwd(), ".env");
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
const { param } = require("express-validator");
require("dotenv").config({ path: ENVPath });

router.get(
  "/get/:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { application_id } = req.params;
      if (!application_id) throw Error("Invalid app ID");
      const result = await plugins.findAll({
        where: {
          application_id,
        },
      });

      res.status(200).send(result);
    } catch (err) {
      // ... error checks
      console.log(err);
    }
  }
);

// //route to enter in all plugins for each application, we need to enter this to have them appear for activation/deactivation on user side
// router.post("/create", async (req, res) => {
//   try {
//     //grab all applications so we can have one entry per plugin per application
//     const applications = await application.findAll({});

//     let pluginList = [];

//     //build list of plugins
//     applications.map((application) => {
//       //for each application, add an object of each plugin, for now we only have orbit
//       pluginList.push({
//         application_id: application.id,
//         name: "Orbit",
//         description:
//           "Enabling this plugin will allow Tombolo to collect data from HPCCs Orbit system and provide dashboard information for it",
//         active: "false",
//         metaData: {
//           notificationEmails: "matthew.fancher@lexisnexisrisk.com",
//           notificationWebhooks:
//             "https://reedelsevier.webhook.office.com/webhookb2/81c072d6-6b47-4eca-9434-73944c464876@9274ee3f-9425-4109-a27f-9fb15c10675d/IncomingWebhook/60019c7653734064b4c225a02b1da597/af40e12f-e839-4801-91e9-e61a20045feb",
//         },
//       });
//     });

//     //create plugins, double checking they don't already exist
//     pluginList.map(async (plugin) => {
//       let exists = await plugins.findOne({
//         where: {
//           name: plugin.name,
//           application_id: plugin.application_id,
//         },
//         raw: true,
//       });
//       console.log(exists);

//       //if it doesn't exist, create plugin
//       if (!exists) {

//         plugins.create(plugin);
//       }
//     });

//     res.status(200).send("success");
//   } catch (err) {
//     // ... error checks
//     console.log(err);
//   }
// });

//activate or deactive plugin
router.put(
  "/toggle/:application_id/:name",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { application_id, name } = req.params;
      if (!application_id) throw Error("Invalid app ID");
      const plugin = await plugins.findOne({
        where: { application_id, name },
        raw: true,
      });
      const { active, id } = plugin;

      // flipping monitoringActive
      await plugins.update({ active: !active }, { where: { id: id } });

      res.status(200).send("Plugin toggled succesfully");
    } catch (err) {
      // ... error checks
      console.log(err);
    }
  }
);

module.exports = router;
