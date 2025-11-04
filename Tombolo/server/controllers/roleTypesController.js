const { RoleType } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleType.findAll();
    return sendSuccess(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllRoles,
};
