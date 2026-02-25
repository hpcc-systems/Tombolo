import { Request, Response } from 'express';
import { RoleType } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await RoleType.findAll();
    return sendSuccess(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    return sendError(res, error);
  }
};

export { getAllRoles };
