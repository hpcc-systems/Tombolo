const { CostMonitoring, sequelize } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');
const {
  uniqueConstraintErrorHandler,
} = require('../utils/uniqueConstraintErrorHandler');
const { getUserFkIncludes } = require('../utils/getUserFkIncludes');

async function createCostMonitoring(req, res) {
  try {
    const { id: userId } = req.user;

    const createResult = await CostMonitoring.create({
      ...req.body,
      createdBy: userId,
      lastUpdatedBy: userId,
    });

    const result = await CostMonitoring.findByPk(createResult.id, {
      include: getUserFkIncludes(true),
    });
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Failed to create cost monitoring', err);
    const errorResult = uniqueConstraintErrorHandler(err, err.message);
    return res.status(errorResult.statusCode).json(errorResult.responseObject);
  }
}

async function updateCostMonitoring(req, res) {
  try {
    const updatedData = { ...req.body, lastUpdatedBy: req.user.id };
    const affected = await CostMonitoring.update(updatedData, {
      where: { id: updatedData.id },
    });

    if (affected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cost monitoring not found',
      });
    }

    const result = await CostMonitoring.findByPk(updatedData.id, {
      include: getUserFkIncludes(true),
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Failed to update cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getCostMonitorings(req, res) {
  try {
    const costMonitorings = await CostMonitoring.findAll({
      where: { applicationId: req.params.applicationId },
      include: getUserFkIncludes(true),
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json({ success: true, data: costMonitorings });
  } catch (err) {
    logger.error('Failed to get cost monitorings', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getCostMonitoringById(req, res) {
  try {
    const costMonitoringRecord = await CostMonitoring.findByPk(req.params.id, {
      include: getUserFkIncludes(true),
    });
    if (!costMonitoringRecord) {
      return res
        .status(404)
        .json({ success: false, message: 'Cost monitoring not found' });
    }
    return res.status(200).json({ success: true, data: costMonitoringRecord });
  } catch (err) {
    logger.error('Failed to get cost monitoring by id', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteCostMonitoring(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const result = await CostMonitoring.handleDelete({
      id: req.params.id,
      deletedByUserId: req.user.id,
      transaction,
    });

    if (!result || result === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Cost monitoring not found' });
    }
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Cost monitoring deleted successfully',
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('Failed to delete cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function evaluateCostMonitoring(req, res) {
  try {
    const { id: approverId } = req.user;
    const approvalStatus = req.body.approvalStatus;
    const isApproved = approvalStatus === 'approved';
    await CostMonitoring.update(
      {
        approvalStatus,
        isActive: req.body.isActive,
        approvedBy: approverId,
        approvedAt: isApproved ? new Date() : null,
        approverComment: isApproved ? req.body.approverComment : null,
      },
      {
        where: {
          id: { [Op.in]: req.body.ids },
        },
        include: getUserFkIncludes(true),
      }
    );

    const result = await CostMonitoring.findAll({
      where: { id: { [Op.in]: req.body.ids } },
      include: getUserFkIncludes(true),
    });

    return res.status(200).json({
      success: true,
      message: 'Cost monitoring(s) evaluated successfully',
      data: result,
    });
  } catch (err) {
    logger.error('Failed to evaluate cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function toggleCostMonitoringActive(req, res) {
  let transaction;
  try {
    transaction = await CostMonitoring.sequelize.transaction();
    const { ids, action } = req.body;
    const { id: userId } = req.user;

    const costMonitorings = await CostMonitoring.findAll({
      where: { id: { [Op.in]: ids }, approvalStatus: 'approved' },
      attributes: ['id', 'approvalStatus'],
    });

    if (costMonitorings.length === 0) {
      logger.error('Toggle Cost monitoring - Cost monitorings not found');
      return res.status(404).send('Cost monitorings not found');
    }

    const monitoringIds = costMonitorings.map(monitoring => monitoring.id);

    await CostMonitoring.update(
      {
        isActive: action === 'start',
        lastUpdatedBy: userId,
      },
      {
        where: { id: { [Op.in]: monitoringIds } },
        transaction,
      }
    );

    await transaction.commit();
    const updatedCostMonitorings = await CostMonitoring.findAll({
      where: { id: { [Op.in]: monitoringIds } },
      include: getUserFkIncludes(true),
    });

    return res.status(200).json({
      success: true,
      message: 'Cost monitoring(s) toggled successfully',
      updatedCostMonitorings,
    });
  } catch (err) {
    transaction && (await transaction.rollback());
    logger.error('Failed to toggle cost monitoring isActive', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function bulkDeleteCostMonitoring(req, res) {
  const transaction = await sequelize.transaction();
  try {
    await CostMonitoring.handleDelete({
      id: req.body.ids,
      deletedByUserId: req.user.id,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: 'Cost monitoring(s) deleted successfully',
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('Failed to bulk delete cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function bulkUpdateCostMonitoring(req, res) {
  let transaction;
  try {
    transaction = await CostMonitoring.sequelize.transaction();
    const inputCostMonitorings = req.body.costMonitorings;

    for (const costMonitoring of inputCostMonitorings) {
      const { id, metaData } = costMonitoring;
      await CostMonitoring.update(
        { metaData },
        {
          where: { id },
          transaction,
        }
      );
    }
    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: 'Cost monitorings updated successfully',
    });
  } catch (err) {
    transaction && (await transaction.rollback());
    logger.error('Failed to bulk update cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createCostMonitoring,
  getCostMonitorings,
  getCostMonitoringById,
  deleteCostMonitoring,
  updateCostMonitoring,
  evaluateCostMonitoring,
  toggleCostMonitoringActive,
  bulkDeleteCostMonitoring,
  bulkUpdateCostMonitoring,
};
