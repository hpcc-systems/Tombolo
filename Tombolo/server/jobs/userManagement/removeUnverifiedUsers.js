// imports
const { Op } = require('sequelize');
const { deleteUser } = require('../../utils/authUtil');

//Local Imports
const { logOrPostMessage } = require('../jobUtils');
const models = require('../../models');
const { user } = models;

(async () => {
  try {
    logOrPostMessage({
      level: 'info',
      text: 'Job to remove unverified users started ...',
    });

    const now = Date.now();

    // get all unverified users, if the user is unverified for more than 24 hours, delete the user
    const unverifiedUsers = await user.findAll({
      where: {
        verifiedUser: false,
        createdAt: {
          [Op.lt]: now - 24 * 60 * 60 * 1000,
        },
      },
    });

    logOrPostMessage({
      level: 'info',
      text: `Number of unverified users to be removed: ${unverifiedUsers.length}`,
    });

    for (const user of unverifiedUsers) {
      await deleteUser(user.id, 'unverified user deleted by system');
    }

    logOrPostMessage({
      level: 'info',
      text: 'Job to remove unverified user completed ...',
    });
  } catch (error) {
    logOrPostMessage({ level: 'error', text: error.message });
  }
})();
