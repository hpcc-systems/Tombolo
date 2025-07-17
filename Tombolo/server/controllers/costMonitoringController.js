const { costMonitoring: CostMonitoring } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

async function createCostMonitoring(req, res) {
  try {
    const result = await CostMonitoring.create(req.body);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Failed to create cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateCostMonitoring(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('Failed to update cost monitoring');
  }
  try {
    const result = await CostMonitoring.update(req.body, {
      where: { id: req.body.id },
    });

    if (result[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cost monitoring not found',
      });
    }

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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('Failed to get Cost Monitorings');
  }
  try {
    const costMonitorings = await CostMonitoring.findAll({
      where: { applicationId: req.params.applicationId },
    });
    return res.status(200).json({ success: true, data: costMonitorings });
  } catch (err) {
    logger.error('Failed to get cost monitorings', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getCostMonitoringById(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('Failed to get Cost Monitoring by id');
  }
  try {
    const costMonitoringRecord = await CostMonitoring.findByPk(req.params.id);
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('Failed to delete Cost Monitoring');
  }
  try {
    const result = await CostMonitoring.destroy({
      where: { id: req.params.id },
    });

    if (!result || result === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Cost monitoring not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Cost monitoring deleted successfully',
    });
  } catch (err) {
    logger.error('Failed to delete cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function evaluateCostMonitoring(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('Failed to evaluate Cost Monitoring');
  }

  try {
    const approvalStatus = req.body.approvalStatus;
    const isApproved = approvalStatus === 'Approved';
    await CostMonitoring.update(
      {
        approvalStatus,
        isActive: req.body.isActive,
        approvedBy: isApproved ? req.body.approvedBy : null,
        approvedAt: isApproved ? new Date() : null,
        approverComment: isApproved ? req.body.approverComment : null,
      },
      {
        where: {
          id: { [Op.in]: req.body.ids },
        },
      }
    );
    return res.status(200).json({
      success: true,
      message: 'Cost monitoring(s) evaluated successfully',
    });
  } catch (err) {
    logger.error('Failed to evaluate cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// TODO: This functionality could probably be extracted and handle multiple types
async function toggleCostMonitoringActive(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('Failed to evaluate Cost Monitoring');
  }

  let transaction;
  try {
    transaction = await CostMonitoring.sequelize.transaction();
    const { ids, action } = req.body;

    const costMonitorings = await CostMonitoring.findAll({
      where: { id: { [Op.in]: ids }, approvalStatus: 'Approved' },
      attributes: ['id', 'approvalStatus'],
    });

    if (costMonitorings.length === 0) {
      logger.error('Toggle Cost monitoring - Cost monitorings not found');
      return res.status(404).send('Cost monitorings not found');
    }

    const monitoringIds = costMonitorings.map(monitoring => monitoring.id);

    await CostMonitoring.update(
      { isActive: action === 'start' },
      {
        where: { id: { [Op.in]: monitoringIds } },
        transaction,
      }
    );

    await transaction.commit();
    const updatedCostMonitorings = await CostMonitoring.findAll({
      where: { id: { [Op.in]: monitoringIds } },
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('Failed to bulk delete Cost Monitorings');
  }
  try {
    await CostMonitoring.destroy({
      where: { id: { [Op.in]: req.body.ids } },
    });
    return res.status(200).json({
      success: true,
      message: 'Cost monitoring(s) deleted successfully',
    });
  } catch (err) {
    logger.error('Failed to bulk delete cost monitoring', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function bulkUpdateCostMonitoring(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send('Failed to bulk delete Cost Monitorings');
  }

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
