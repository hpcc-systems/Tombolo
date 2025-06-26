const logger = require('../config/logger');
const models = require('../models');
const UserRoles = models.UserRoles;
const Roles = models.RoleTypes;

const checkStatus = async (req, res) => {
  return res.send("Tombolo's Backend is running succesfully");
};

const checkOwnerExists = async (req, res) => {
  try {
    const ownerRole = await Roles.findOne({
      where: { roleName: 'owner' },
    });

    if (!ownerRole) {
      return false;
    }

    const owners = await UserRoles.findOne({
      where: { roleId: ownerRole.id },
    });

    const exists = owners?.dataValues ? true : false;

    return res.status(200).json({ success: true, data: exists });
  } catch (err) {
    logger.error(`Check owner exists: ${err.message}`);
    return false;
  }
};

module.exports = {
  checkStatus,
  checkOwnerExists,
};
