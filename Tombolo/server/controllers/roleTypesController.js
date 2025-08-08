const { RoleType } = require('../models');

const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleType.findAll();
    return res.status(200).json({ success: true, data: roles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllRoles,
};
