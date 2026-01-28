import { RoleType } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleType.findAll();
    return sendSuccess(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    return sendError(res, error);
  }
};

export { getAllRoles };
