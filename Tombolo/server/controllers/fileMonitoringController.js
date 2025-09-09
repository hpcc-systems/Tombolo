const { FileMonitoring, Cluster, sequelize } = require('../models');
const logger = require('../config/logger');
const {
  uniqueConstraintErrorHandler,
} = require('../utils/uniqueConstraintErrorHandler');
const { getUserFkIncludes } = require('../utils/getUserFkIncludes');
const { APPROVAL_STATUS } = require('../config/constants');

// Wrapper function to get common includes
const getCommonIncludes = () => [
  ...getUserFkIncludes(true),
  {
    model: Cluster,
    as: 'cluster',
    attributes: ['id', 'name', 'thor_host', 'thor_port'],
  },
];

async function createFileMonitoring(req, res) {
  try {
    const { id: userId } = req.user;

    const createResult = await FileMonitoring.create({
      ...req.body,
      createdBy: userId,
      lastUpdatedBy: userId,
      approvalStatus: APPROVAL_STATUS.PENDING,
      isActive: false,
    });

    const result = await FileMonitoring.findByPk(createResult.id, {
      include: getCommonIncludes(),
    });
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Failed to create file monitoring', err);
    const errorResult = uniqueConstraintErrorHandler(err, err.message);
    return res.status(errorResult.statusCode).json(errorResult.responseObject);
  }
}

async function updateFileMonitoring(req, res) {
  try {
    const { id } = req.params;

    const updatedData = { ...req.body, lastUpdatedBy: req.user.id };
    const result = await FileMonitoring.update(updatedData, {
      where: { id },
    });

    if (result[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'File monitoring not found',
      });
    }

    // Get the updated file monitoring entry
    const updatedFileMonitoring = await FileMonitoring.findByPk(id, {
      include: getCommonIncludes(),
    });

    return res.status(200).json({
      success: true,
      data: updatedFileMonitoring,
    });
  } catch (err) {
    logger.error('Failed to update file monitoring', err);
    const errorResult = uniqueConstraintErrorHandler(err, err.message);
    return res.status(errorResult.statusCode).json(errorResult.responseObject);
  }
}

async function getFileMonitoringById(req, res) {
  try {
    const { id } = req.params;
    const result = await FileMonitoring.findByPk(id, {
      include: getUserFkIncludes(true),
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'File monitoring not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Failed to fetch file monitoring by ID', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function getFileMonitoring(req, res) {
  try {
    const { applicationId } = req.params;
    const result = await FileMonitoring.findAll({
      where: { applicationId },
      include: getCommonIncludes(),
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Failed to fetch file monitoring', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function evaluateFileMonitoring(req, res) {
  try {
    const { ids, approvalStatus, approverComment, isActive } = req.body;

    // Find all with ids
    const fileMonitorings = await FileMonitoring.findAll({
      where: { id: ids },
    });

    if (fileMonitorings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No file monitoring entries found for the provided IDs',
      });
    }

    // Update each file monitoring entry
    await Promise.all(
      fileMonitorings.map(fileMonitoring =>
        fileMonitoring.update({
          approvalStatus,
          approverComment,
          isActive: !!(approvalStatus === APPROVAL_STATUS.APPROVED && isActive),
          lastUpdatedBy: req.user.id,
        })
      )
    );

    // Fetch the updated entries to return
    const updatedFileMonitoring = await FileMonitoring.findAll({
      where: { id: ids },
      include: getCommonIncludes(),
    });

    return res.status(200).json({
      success: true,
      data: updatedFileMonitoring,
      message: 'File monitoring evaluated successfully',
    });
  } catch (err) {
    logger.error('Failed to evaluate file monitoring', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function toggleFileMonitoringActive(req, res) {
  try {
    const { ids, isActive } = req.body;

    // Find all with ids
    const fm = await FileMonitoring.findAll({
      where: { id: ids },
    });

    if (fm.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No file monitoring entries found for the provided IDs',
      });
    }

    // If trying to activate and approvalStatues is not 'approved' remove that from ids to update
    const eligibleForToggle = fm.filter(fileMonitoring => {
      if (
        isActive &&
        fileMonitoring.approvalStatus !== APPROVAL_STATUS.APPROVED
      ) {
        return false;
      }
      return true;
    });

    // Update each file monitoring entry
    await Promise.all(
      eligibleForToggle.map(fileMonitoring =>
        fileMonitoring.update({
          isActive,
          lastUpdatedBy: req.user.id,
        })
      )
    );

    // Fetch the updated entries to return
    const updatedFileMonitoring = await FileMonitoring.findAll({
      where: { id: ids },
      include: getCommonIncludes(),
    });

    return res.status(200).json({
      data: updatedFileMonitoring,
      success: true,
      message: 'File monitoring status updated successfully',
    });
  } catch (err) {
    logger.error('Failed to toggle file monitoring active status', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function deleteFileMonitoring(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { ids } = req.body;

    // First update the deletedBy field
    await FileMonitoring.update(
      { deletedBy: req.user.id },
      { where: { id: ids }, transaction }
    );

    // Then delete the entries
    const result = await FileMonitoring.destroy({
      where: { id: ids },
      transaction,
    });

    // Commit transaction if everything succeeds
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `${result} file monitoring entries deleted successfully`,
    });
  } catch (err) {
    // Rollback transaction on error
    await transaction.rollback();
    logger.error('Failed to bulk delete file monitoring', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function bulkUpdateFileMonitoring(req, res) {
  const { updatedData } = req.body;

  const results = {
    success: [],
    failed: [],
  };

  for (const {
    id,
    metaData: { contacts },
  } of updatedData) {
    try {
      const fileMonitoring = await FileMonitoring.findByPk(id);

      if (!fileMonitoring) {
        results.failed.push({ id, reason: 'FileMonitoring not found' });
        continue; // move to the next record
      }

      const currentMetaData = fileMonitoring.metaData || {};
      const updatedMetaData = {
        ...currentMetaData,
        contacts: {
          ...currentMetaData.contacts,
          ...contacts,
        },
      };

      await FileMonitoring.update(
        { metaData: updatedMetaData },
        { where: { id } }
      );

      results.success.push(id);
    } catch (err) {
      logger.error('Failed to update FileMonitoring', err);
      results.failed.push({ id, reason: err.message });
    }
  }

  try {
    const updatedFileMonitoring = await FileMonitoring.findAll({
      where: { id: results.success },
      include: getUserFkIncludes(true),
    });

    return res.status(200).json({
      success: true,
      message: `Bulk update completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
      data: updatedFileMonitoring,
      errors: results.failed,
    });
  } catch (err) {
    logger.error('Failed to fetch updated records:', err);
    return res.status(200).json({
      success: false,
      message:
        'Bulk update partially completed, but fetching updated records failed',
      errors: results.failed,
    });
  }
}

module.exports = {
  createFileMonitoring,
  updateFileMonitoring,
  getFileMonitoringById,
  getFileMonitoring,
  evaluateFileMonitoring,
  toggleFileMonitoringActive,
  deleteFileMonitoring,
  bulkUpdateFileMonitoring,
};
