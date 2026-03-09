import logger from '../config/logger.js';
import { UserRole, RoleType, sequelize } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Lightweight healthcheck for Docker - no auth required
const healthcheck = async (req, res) => {
  try {
    // Check database connectivity
    await sequelize.authenticate();

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err) {
    logger.error('Healthcheck failed:', err);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
};

const checkStatus = async (req, res) => {
  return sendSuccess(res, null, "Tombolo's Backend is running successfully");
};

const checkOwnerExists = async (req, res) => {
  try {
    const ownerRole = await RoleType.findOne({
      where: { roleName: 'owner' },
    });

    if (!ownerRole) {
      return sendError(res, 'Owner role does not exist', 400);
    }

    const owners = await UserRole.findOne({
      where: { roleId: ownerRole.id },
    });

    const exists = owners?.dataValues ? true : false;

    return sendSuccess(res, exists, 'Owner existence check completed');
  } catch (err) {
    logger.error('Check owner exists: ', err);
    return sendError(res, err);
  }
};

export { healthcheck, checkStatus, checkOwnerExists };
