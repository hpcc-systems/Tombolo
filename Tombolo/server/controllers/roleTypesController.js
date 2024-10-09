const RoleTypes = require("../models").RoleTypes;

const getAllRoles = async (req, res) => {
    try {
        const roles = await RoleTypes.findAll();
        return res.status(200).json(roles);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
    };

module.exports = {
    getAllRoles
};