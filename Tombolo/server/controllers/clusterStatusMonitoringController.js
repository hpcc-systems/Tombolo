const models = require('../models');
const logger = require('../config/logger');
const { sequelize } = models;

const { clusterStatusMonitoring } = models;

// Create a new cluster status monitoring
const createClusterStatusMonitoring = async (req, res) => {
  try {
    await clusterStatusMonitoring.create({
      ...req.body,
      createdBy: req.user.id,
      lastUpdatedBy: req.user.id,
    });
    res
      .status(201)
      .send({ message: 'Cluster status monitoring created successfully' });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to create cluster', err);
  }
};

// Get cluster monitoring by ID
const getClusterStatusMonitoringById = async (req, res) => {
  try {
    const monitoring = await clusterStatusMonitoring.findOne({
      where: { id: req.params.id },
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
const getAllClusterStatusMonitoring = async (req, res) => {
  try {
    const monitoring = await clusterStatusMonitoring.findAll();
    res.status(200).send(monitoring);
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('failed to get all cluster monitoring', err);
  }
};

// Update cluster status monitoring by ID
const updateClusterStatusMonitoring = async (req, res) => {
  try {
    const monitoring = await clusterStatusMonitoring.findOne({
      id: req.body.id,
    });
    if (!monitoring) {
      return res
        .status(404)
        .send({ message: 'Cluster status monitoring not found' });
    }
    await monitoring.update({
      ...req.body,
      updatedBy: req.user.id,
    });
    res
      .status(200)
      .send({ message: 'Cluster status monitoring updated successfully' });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to update cluster monitoring', err);
  }
};

// Toggle monitoring status
const toggleClusterStatusMonitoringStatus = async (req, res) => {
  try {
    const monitoring = await clusterStatusMonitoring.findOne({
      id: req.params.id,
    });
    if (!monitoring) {
      return res
        .status(404)
        .send({ message: 'Cluster status monitoring not found' });
    }
    await monitoring.update({
      isActive: !monitoring.isActive,
      updatedBy: req.user.id,
    });
    res.status(200).send({
      message: 'Cluster status monitoring status updated successfully',
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to toggle monitoring status', err);
  }
};

// Change approval status (evaluate -> approved, rejected)
const evaluateClusterStatusMonitoring = async (req, res) => {
  try {
    const monitoring = await clusterStatusMonitoring.findOne({
      id: req.params.id,
    });
    if (!monitoring) {
      return res
        .status(404)
        .send({ message: 'Cluster status monitoring not found' });
    }
    await monitoring.update({
      approvalStatus: req.body.approvalStatus,
      updatedBy: req.user.id,
    });
    res.status(200).send({
      message: 'Cluster status monitoring status updated successfully',
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
    logger.error('Failed to evaluate monitoring', err);
  }
};

// Bulk update ( only contacts can be bulk updated)
const bulkUpdateClusterStatusMonitoring = async (req, res) => {
  try {
    const { monitoring } = req.body;
    const results = {
      successful: [],
      failed: [],
    };

    await Promise.all(
      monitoring.map(async data => {
        try {
          const monitoringRecord = await clusterStatusMonitoring.findOne({
            where: { id: data.id },
          });

          if (!monitoringRecord) {
            results.failed.push({
              id: data.id,
              error: 'Record not found',
            });
            return;
          }

          await monitoringRecord.update({
            metaData: {
              ...monitoringRecord.metaData,
              contacts: {
                primaryContacts: data.primaryContacts,
                secondaryContacts: data.secondaryContacts || [],
                notifyContacts: data.notifyContacts || [],
              },
            },
            updatedBy: req.user.id,
          });

          results.successful.push(data.id);
        } catch (error) {
          results.failed.push({
            id: data.id,
            error: error.message,
          });
        }
      })
    );

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
const deleteClusterStatusMonitoring = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { ids } = req.body;

    // First transaction
    await clusterStatusMonitoring.update(
      { deletedBy: req.user.id },
      {
        where: { id: ids },
        transaction,
      }
    );

    // Second transaction
    await clusterStatusMonitoring.destroy({
      where: { id: ids },
      transaction,
    });

    // Commit both operations
    await transaction.commit();

    res
      .status(200)
      .send({ message: 'Cluster status monitoring deleted successfully' });
  } catch (err) {
    // Rollback both operations if either fails
    await transaction.rollback();

    res.status(500).send({ message: err.message });
    logger.error('Failed to delete monitoring', err);
  }
};

// Exports
module.exports = {
  createClusterStatusMonitoring,
  getClusterStatusMonitoringById,
  getAllClusterStatusMonitoring,
  updateClusterStatusMonitoring,
  toggleClusterStatusMonitoringStatus,
  evaluateClusterStatusMonitoring,
  bulkUpdateClusterStatusMonitoring,
  deleteClusterStatusMonitoring,
};
