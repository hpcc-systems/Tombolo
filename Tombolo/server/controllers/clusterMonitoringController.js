const { Op } = require('sequelize');
const { ClusterMonitoring, sequelize, Cluster } = require('../models');
const logger = require('../config/logger');
const { getUserFkIncludes } = require('../utils/getUserFkIncludes');
const { APPROVAL_STATUS } = require('../config/constants');
const { sendError, sendSuccess, sendResponse } = require('../utils/response');

// Common includes for cluster monitoring - customize with additional  if needed
const getCommonIncludes = ({ customIncludes = [] }) => {
  return [
    ...getUserFkIncludes(true),
    {
      model: Cluster,
      as: 'cluster',
      attributes: ['id', 'name', 'thor_host', 'thor_port'],
    },
    ...customIncludes,
  ];
};

// Create a new cluster status monitoring
const createClusterMonitoring = async (req, res) => {
  try {
    const newMonitoring = await ClusterMonitoring.create({
      ...req.body,
      createdBy: req.user.id,
      lastUpdatedBy: req.user.id,
    });

    // Get the monitoring data with associated models
    const monitoring = await ClusterMonitoring.findOne({
      where: { id: newMonitoring.id },
      order: [['createdAt', 'DESC']],
      include: getCommonIncludes({ customIncludes: [] }),
    });

    return sendSuccess(
      res,
      monitoring,
      'Cluster status monitoring created successfully'
    );
  } catch (err) {
    logger.error('Failed to create cluster monitoring', err);
    return sendError(res, err.message);
  }
};

// Get cluster monitoring by ID
const getClusterMonitoringById = async (req, res) => {
  try {
    const monitoring = await ClusterMonitoring.findOne({
      where: { id: req.params.id },
      include: getCommonIncludes({ customIncludes: [] }),
    });
    if (!monitoring) {
      return sendError(res, 'Cluster status monitoring not found', 404);
    }
    return sendSuccess(res, monitoring);
  } catch (err) {
    logger.error('Failed to get cluster monitoring by ID', err);
    return sendError(res, err.message);
  }
};

// Get all the cluster status monitoring
const getAllClusterMonitoring = async (req, res) => {
  try {
    const monitoring = await ClusterMonitoring.findAll({
      include: getCommonIncludes({ customIncludes: [] }),
      order: [['createdAt', 'DESC']],
    });
    return sendSuccess(res, monitoring);
  } catch (err) {
    logger.error('Failed to get all cluster monitoring', err);
    return sendError(res, err.message);
  }
};

// Update cluster status monitoring by ID
const updateClusterMonitoring = async (req, res) => {
  try {
    const monitoring = await ClusterMonitoring.findOne({
      where: { id: req.body.id },
    });

    if (!monitoring) {
      return sendError(res, 'Cluster status monitoring not found', 404);
    }

    // Corrected update syntax
    await ClusterMonitoring.update(
      {
        ...req.body,
        isActive: false,
        approvalStatus: APPROVAL_STATUS.PENDING,
        updatedBy: req.user.id,
      },
      {
        where: { id: req.body.id },
      }
    );

    // Fetch the updated monitoring with associated models
    const updatedMonitoring = await ClusterMonitoring.findOne({
      where: { id: req.body.id },
      include: getCommonIncludes({ customIncludes: [] }),
    });

    return sendSuccess(
      res,
      updatedMonitoring,
      'Cluster status monitoring updated successfully'
    );
  } catch (err) {
    logger.error('Failed to update cluster monitoring', err);
    return sendError(res, err.message);
  }
};

// Toggle monitoring status
const toggleClusterMonitoringStatus = async (req, res) => {
  try {
    const monitoring = await ClusterMonitoring.findOne({
      where: {
        id: req.body.id,
      },
      raw: true,
    });

    if (!monitoring) {
      return sendError(res, 'Cluster status monitoring not found', 404);
    }

    // If approvalStatus is not 'approved', return 400
    if (monitoring.approvalStatus !== APPROVAL_STATUS.APPROVED) {
      return sendError(
        res,
        'Cluster status monitoring must be approved to activate',
        400
      );
    }

    await ClusterMonitoring.update(
      {
        isActive: !monitoring.isActive,
        updatedBy: req.user.id,
      },
      {
        where: { id: req.body.id },
      }
    );
    return sendSuccess(
      res,
      null,
      'Cluster status monitoring status updated successfully'
    );
  } catch (err) {
    logger.error('Failed to toggle monitoring status', err);
    return sendError(res, err.message);
  }
};

// Bulk toggle req.body (ids: [], isActive: true/false)
const toggleBulkClusterMonitoringStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    // Fetch all monitoring records to be updated
    const monitorings = await ClusterMonitoring.findAll({
      where: { id: { [Op.in]: ids } },
      raw: true,
    });

    if (monitorings.length === 0) {
      return sendError(res, 'No cluster status monitoring records found', 404);
    }

    // Check if any monitoring is not approved
    const unapprovedMonitorings = monitorings.filter(
      mon => mon.approvalStatus !== APPROVAL_STATUS.APPROVED
    );

    // iterate and remove unapproved monitoring from the list
    const idsToProceedWith = [];
    monitorings.forEach(m => {
      if (m.approvalStatus == APPROVAL_STATUS.APPROVED) {
        // remove from ids
        idsToProceedWith.push(m.id);
      }
    });

    if (idsToProceedWith.length === 0) {
      return sendError(
        res,
        {
          message: 'No monitorings to toggle. All are in unapproved state',
          unapprovedIds: unapprovedMonitorings.map(mon => mon.id),
        },
        400
      );
    }

    // Update isActive status for all specified IDs
    await ClusterMonitoring.update(
      {
        isActive,
        updatedBy: req.user.id,
      },
      {
        where: { id: { [Op.in]: idsToProceedWith } },
      }
    );

    return sendSuccess(
      res,
      null,
      'Cluster status monitoring active status updated successfully'
    );
  } catch (err) {
    logger.error('Failed to bulk toggle monitoring status', err);
    return sendError(res, err.message);
  }
};

// Change approval status (evaluate -> approved, rejected)
const evaluateClusterMonitoring = async (req, res) => {
  try {
    const { ids, approvalStatus, approverComment, isActive } = req.body;
    await ClusterMonitoring.update(
      {
        approvedBy: req.user.id,
        approvalStatus,
        approverComment,
        approvedAt: new Date(),
        isActive:
          approvalStatus === APPROVAL_STATUS.REJECTED ? false : isActive,
      }, // fields to update
      { where: { id: { [Op.in]: ids } } }
    );

    // Fetch the updated monitoring records with associated models
    const updatedMonitoring = await ClusterMonitoring.findAll({
      where: { id: { [Op.in]: ids } },
      include: getCommonIncludes({ customIncludes: [] }),
    });

    // If no records were updated, return 404
    if (updatedMonitoring.length === 0) {
      return sendError(res, 'No cluster status monitoring records found', 404);
    }

    // Return the updated records
    return sendSuccess(
      res,
      updatedMonitoring,
      'Cluster status monitoring evaluated successfully'
    );
  } catch (err) {
    logger.error('Failed to evaluate monitoring', err);
    return sendError(res, err.message);
  }
};

// Bulk update ( only contacts can be bulk updated)
const bulkUpdateClusterMonitoring = async (req, res) => {
  try {
    const { clusterMonitoring } = req.body;

    // Ids of all monitoring to be updated
    const ids = clusterMonitoring.map(data => data.id);

    // Get existing monitoring to be updated
    const existingMonitoring = await ClusterMonitoring.findAll({
      where: { id: { [Op.in]: ids } },
      raw: true,
    });

    // convert clusterMonitoring to an object for easy access
    const updateDataObj = {};
    clusterMonitoring.forEach(data => {
      updateDataObj[data.id] = data?.metaData?.contacts || data;
    });

    const results = {
      successful: [],
      failed: [],
    };

    for (const monitoring of existingMonitoring) {
      try {
        await ClusterMonitoring.update(
          {
            metaData: {
              ...monitoring.metaData,
              contacts: updateDataObj[monitoring.id],
            },
            updatedBy: req.user.id,
          },
          { where: { id: monitoring.id } }
        );
        results.successful.push(monitoring.id);
      } catch (error) {
        results.failed.push({
          id: monitoring.id,
          error: error.message,
        });
        logger.error(`Failed to update monitoring id: ${monitoring.id}`, error);
      }
    }

    const statusCode = results.failed.length > 0 ? 207 : 200;
    const message =
      statusCode === 207
        ? 'Bulk update partially successful'
        : 'Bulk update completed successfully';

    const responseData = {
      successful: results.successful.length,
      failed: results.failed.length,
      results,
    };

    return sendResponse(res, {
      status: statusCode,
      success: statusCode !== 207,
      message,
      data: responseData,
      errors: results.failed.length > 0 ? results.failed.map(f => f.error) : [],
    });
  } catch (err) {
    logger.error('Failed to bulk update monitoring', err);
    return sendError(res, err.message);
  }
};

// Delete monitoring by id(s)
const deleteClusterMonitoring = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { ids } = req.body;

    // Update deletedBy before soft-delete
    await ClusterMonitoring.update(
      { deletedBy: req.user.id },
      { where: { id: ids }, transaction }
    );

    await ClusterMonitoring.handleDelete({
      id: ids,
      deletedByUserId: req.user.id,
      transaction,
    });

    await transaction.commit();

    return sendSuccess(
      res,
      null,
      'Cluster status monitoring deleted successfully'
    );
  } catch (err) {
    await transaction.rollback();
    logger.error('Failed to delete monitoring', err);
    return sendError(res, err.message);
  }
};

// Exports
module.exports = {
  createClusterMonitoring,
  getClusterMonitoringById,
  getAllClusterMonitoring,
  updateClusterMonitoring,
  toggleClusterMonitoringStatus,
  evaluateClusterMonitoring,
  bulkUpdateClusterMonitoring,
  deleteClusterMonitoring,
  toggleBulkClusterMonitoringStatus,
};
