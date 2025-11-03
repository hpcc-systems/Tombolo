const { Op } = require('sequelize');
const { ClusterMonitoring, sequelize, Cluster } = require('../models');
const logger = require('../config/logger');
const { getUserFkIncludes } = require('../utils/getUserFkIncludes');
const { APPROVAL_STATUS } = require('../config/constants');

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

    res.status(201).send({
      message: 'Cluster status monitoring created successfully',
      data: monitoring,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to create cluster', err);
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
      return res
        .status(404)
        .send({ message: 'Cluster status monitoring not found' });
    }
    res.status(200).send({ data: monitoring });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to get cluster monitoring by ID', err);
  }
};

// Get all the cluster status monitoring
const getAllClusterMonitoring = async (req, res) => {
  try {
    const monitoring = await ClusterMonitoring.findAll({
      include: getCommonIncludes({ customIncludes: [] }),
      order: [['createdAt', 'DESC']],
    });
    res.status(200).send(monitoring);
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('failed to get all cluster monitoring', err);
  }
};

// Update cluster status monitoring by ID
const updateClusterMonitoring = async (req, res) => {
  try {
    const monitoring = await ClusterMonitoring.findOne({
      where: { id: req.body.id },
    });

    if (!monitoring) {
      return res
        .status(404)
        .send({ message: 'Cluster status monitoring not found' });
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

    res.status(200).send({
      message: 'Cluster status monitoring updated successfully',
      data: updatedMonitoring,
    });
  } catch (err) {
    logger.error('Failed to update cluster monitoring', err);
    res.status(500).send({ message: err.message });
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
      return res
        .status(404)
        .send({ message: 'Cluster status monitoring not found' });
    }

    // If approvalStatus is not 'approved', return 400
    if (monitoring.approvalStatus !== APPROVAL_STATUS.APPROVED) {
      return res.status(400).send({
        message: 'Cluster status monitoring must be approved to activate',
      });
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
    res.status(200).send({
      message: 'Cluster status monitoring status updated successfully',
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to toggle monitoring status', err);
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
      return res
        .status(404)
        .send({ message: 'No cluster status monitoring records found' });
    }

    // Check if any monitoring is not approved
    const unapprovedMonitorings = monitorings.filter(
      mon => mon.approvalStatus !== APPROVAL_STATUS.APPROVED
    );

    if (unapprovedMonitorings.length > 0) {
      return res.status(400).send({
        message:
          'All selected cluster status monitoring must be approved to change active status',
        unapprovedIds: unapprovedMonitorings.map(mon => mon.id),
      });
    }

    // Update isActive status for all specified IDs
    await ClusterMonitoring.update(
      {
        isActive,
        updatedBy: req.user.id,
      },
      {
        where: { id: { [Op.in]: ids } },
      }
    );

    res.status(200).send({
      message: 'Cluster status monitoring active status updated successfully',
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to bulk toggle monitoring status', err);
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
      return res
        .status(404)
        .send({ message: 'No cluster status monitoring records found' });
    }

    // Return the updated records
    res.status(200).send({
      message: 'Cluster status monitoring evaluated successfully',
      data: updatedMonitoring,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to evaluate monitoring', err);
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

    res.status(statusCode).send({
      message:
        statusCode === 207
          ? 'Bulk update partially successful'
          : 'Bulk update completed successfully',
      successful: results.successful.length,
      failed: results.failed.length,
      results,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to bulk update monitoring', err);
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

    res
      .status(200)
      .send({ message: 'Cluster status monitoring deleted successfully' });
  } catch (err) {
    await transaction.rollback();

    res.status(500).send({ message: err.message });
    logger.error('Failed to delete monitoring', err);
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
