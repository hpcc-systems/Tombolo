// imports
const { parentPort } = require("worker_threads");
const { Op } = require("sequelize");


//Local Imports
const models = require("../../models");
const { user} = models;


(async () => {
  try {
    parentPort && parentPort.postMessage({level: "info", text : "Job to remove unverified users started ..."});

    const now = Date.now();

    // get all unverified users, if the user is unverified for more than 24 hours, delete the user
    const unverifiedUsers = await user.findAll({
      where: {
        verifiedUser: false,
        createdAt: {
          [Op.lt]: now - 24 * 60 * 60 * 1000
        }
      }
    });

    parentPort && parentPort.postMessage({level: "info", text : `Number of unverified users to be removed: ${unverifiedUsers.length}`});

    for (const user of unverifiedUsers) {
      await user.destroy();
    }

    parentPort && parentPort.postMessage({level: "info", text : "Job to remove unverified user completed ..."});

  } catch (error) {
    parentPort && parentPort.postMessage({level: "error", text : error.message});
  }
})();