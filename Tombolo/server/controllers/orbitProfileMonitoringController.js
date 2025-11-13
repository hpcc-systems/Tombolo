// Imports from libraries
const Sequelize = require('sequelize');

// Local Imports
const logger = require('../config/logger');
const { OrbitProfileMonitoring, Cluster, sequelize } = require('../models');
const { APPROVAL_STATUS } = require('../config/constants');
const { sendError, sendSuccess } = require('../utils/response');
const { getUserFkIncludes } = require('../utils/getUserFkIncludes');
const {
  uniqueConstraintErrorHandler,
} = require('../utils/uniqueConstraintErrorHandler');

// Get all orbit profile monitorings for an application
const getAllOrbitProfileMonitorings = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const orbitProfileMonitorings = await OrbitProfileMonitoring.findAll({
      where: { applicationId },
      include: [
        {
          model: Cluster,
          as: 'cluster',
          attributes: ['id', 'name', 'thor_host', 'thor_port'],
        },
        ...getUserFkIncludes(),
      ],
      order: [['createdAt', 'DESC']],
    });

    sendSuccess(res, orbitProfileMonitorings);
  } catch (err) {
    logger.error('Error fetching orbit profile monitorings:', err);
    sendError(res, 'Failed to fetch orbit profile monitorings');
  }
};

// Get orbit profile monitoring by ID
const getOrbitProfileMonitoringById = async (req, res) => {
  try {
    const { id } = req.params;

    const orbitProfileMonitoring = await OrbitProfileMonitoring.findOne({
      where: { id },
      include: [
        {
          model: Cluster,
          as: 'cluster',
          attributes: ['id', 'name', 'thor_host', 'thor_port'],
        },
        ...getUserFkIncludes(),
      ],
    });

    if (!orbitProfileMonitoring) {
      return sendError(res, 'Orbit profile monitoring not found', 404);
    }

    sendSuccess(res, orbitProfileMonitoring);
  } catch (err) {
    logger.error('Error fetching orbit profile monitoring:', err);
    sendError(res, 'Failed to fetch orbit profile monitoring');
  }
};

// Create new orbit profile monitoring
const createOrbitProfileMonitoring = async (req, res) => {
  try {
    const { name, clusterId, description, metaData, applicationId } = req.body;
    const userId = req.user.id;

    const newOrbitProfileMonitoring = await OrbitProfileMonitoring.create({
      applicationId,
      name,
      description,
      clusterId,
      metaData,
      createdBy: userId,
      lastUpdatedBy: userId,
      approvalStatus: APPROVAL_STATUS.PENDING,
      isActive: false,
    });

    const createdMonitoring = await OrbitProfileMonitoring.findByPk(
      newOrbitProfileMonitoring.id,
      {
        include: [
          {
            model: Cluster,
            as: 'cluster',
            attributes: ['id', 'name', 'thor_host', 'thor_port'],
          },
          ...getUserFkIncludes(),
        ],
      }
    );

    sendSuccess(
      res,
      createdMonitoring,
      'Orbit profile monitoring created successfully',
      201
    );
  } catch (err) {
    logger.error('Error creating orbit profile monitoring:', err);

    if (err instanceof Sequelize.UniqueConstraintError) {
      return uniqueConstraintErrorHandler(res, err);
    }

    sendError(res, 'Failed to create orbit profile monitoring');
  }
};

// Update orbit profile monitoring
const updateOrbitProfileMonitoring = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const orbitProfileMonitoring = await OrbitProfileMonitoring.findOne({
      where: { id },
    });

    if (!orbitProfileMonitoring) {
      return sendError(res, 'Orbit profile monitoring not found', 404);
    }

    await orbitProfileMonitoring.update({
      ...updateData,
      lastUpdatedBy: userId,
      approvalStatus: APPROVAL_STATUS.PENDING, // Reset to pending on update
    });

    const updatedMonitoring = await OrbitProfileMonitoring.findByPk(id, {
      include: [
        {
          model: Cluster,
          as: 'cluster',
          attributes: ['id', 'name', 'thor_host', 'thor_port'],
        },
        ...getUserFkIncludes(),
      ],
    });

    sendSuccess(
      res,
      updatedMonitoring,
      'Orbit profile monitoring updated successfully'
    );
  } catch (err) {
    logger.error('Error updating orbit profile monitoring:', err);

    if (err instanceof Sequelize.UniqueConstraintError) {
      return uniqueConstraintErrorHandler(res, err);
    }

    sendError(res, 'Failed to update orbit profile monitoring');
  }
};

// Delete orbit profile monitoring (soft delete)
const deleteOrbitProfileMonitoring = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    // Find the orbit profile monitoring for all the ids and delete them and also update deletedBy and deletedAt
    await sequelize.transaction(async t => {
      await OrbitProfileMonitoring.update(
        {
          deletedBy: userId,
          deletedAt: new Date(),
        },
        {
          where: { id: { [Sequelize.Op.in]: ids } },
          transaction: t,
        }
      );
    });

    sendSuccess(res, ids, 'Orbit profile monitoring deleted successfully');
  } catch (err) {
    logger.error('Error deleting orbit profile monitoring:', err);
    sendError(res, 'Failed to delete orbit profile monitoring');
  }
};

// Toggle orbit profile monitoring status ( Pausing or starting the monitoring  )
const toggleOrbitProfileMonitoringStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    const userId = req.user.id;

    // Find all for ids where the approvalStatus is approved
    const orbitProfileMonitorings = await OrbitProfileMonitoring.findAll({
      where: {
        id: { [Sequelize.Op.in]: ids },
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
    });

    if (orbitProfileMonitorings.length === 0) {
      return sendError(res, 'No eligible orbit profile monitorings found', 404);
    }

    await OrbitProfileMonitoring.update(
      {
        isActive,
        lastUpdatedBy: userId,
      },
      {
        where: {
          id: { [Sequelize.Op.in]: ids },
          approvalStatus: APPROVAL_STATUS.APPROVED,
        },
      }
    );
    // Re-fetch the updated monitorings
    const updatedMonitorings = await OrbitProfileMonitoring.findAll({
      where: {
        id: { [Sequelize.Op.in]: ids },
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
      include: [
        {
          model: Cluster,
          as: 'cluster',
          attributes: ['id', 'name', 'thor_host', 'thor_port'],
        },
        ...getUserFkIncludes(),
      ],
    });

    sendSuccess(
      res,
      updatedMonitorings,
      'Monitoring status updated successfully'
    );
  } catch (err) {
    logger.error('Error toggling orbit profile monitoring status:', err);
    sendError(res, 'Failed to update monitoring status');
  }
};

// Approve orbit profile monitoring
const evaluateOrbitProfileMonitoring = async (req, res) => {
  try {
    const { comment, ids, isActive } = req.body;
    const userId = req.user.id;

    // Find all for ids and update approverComment, approvalStatus, isActive
    await OrbitProfileMonitoring.update(
      {
        approverComment: comment || null,
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive,
        approvedBy: userId,
        approvedAt: new Date(),
        lastUpdatedBy: userId,
      },
      {
        where: { id: { [Sequelize.Op.in]: ids } },
      }
    );

    // Re-fetch the updated monitoring
    const updatedMonitoring = await OrbitProfileMonitoring.findAll({
      where: { id: { [Sequelize.Op.in]: ids } },
      include: [
        {
          model: Cluster,
          as: 'cluster',
          attributes: ['id', 'name', 'thor_host', 'thor_port'],
        },
        ...getUserFkIncludes(),
      ],
    });

    sendSuccess(
      res,
      updatedMonitoring,
      'Orbit profile monitoring approved successfully'
    );
  } catch (err) {
    logger.error('Error approving orbit profile monitoring:', err);
    sendError(res, 'Failed to approve orbit profile monitoring');
  }
};

module.exports = {
  getAllOrbitProfileMonitorings,
  getOrbitProfileMonitoringById,
  createOrbitProfileMonitoring,
  updateOrbitProfileMonitoring,
  deleteOrbitProfileMonitoring,
  toggleOrbitProfileMonitoringStatus,
  evaluateOrbitProfileMonitoring,
};
