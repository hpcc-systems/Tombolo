const logger = require('../config/logger');
const { UserRole, RoleType } = require('../models');

const checkStatus = async (req, res) => {
  return res.send("Tombolo's Backend is running successfully");
};

const checkOwnerExists = async (req, res) => {
  try {
    const ownerRole = await RoleType.findOne({
      where: { roleName: 'owner' },
    });

    if (!ownerRole) {
      return res.status(400).json({
        success: false,
        message: 'Owner role does not exist',
      });
    }

    const owners = await UserRole.findOne({
      where: { roleId: ownerRole.id },
    });

    const exists = owners?.dataValues ? true : false;

    return res.status(200).json({ success: true, data: exists });
  } catch (err) {
    logger.error('Check owner exists: ', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  checkStatus,
  checkOwnerExists,
};
