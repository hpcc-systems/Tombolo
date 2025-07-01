const { costMonitoring: CostMonitoring } = require('../models');
const logger = require('../config/logger');

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
  try {
    const result = await CostMonitoring.update(req.body, {
      where: { id: req.body.id },
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
    const costMonitorings = await CostMonitoring.findAll();
    return res.status(200).json({ success: true, data: costMonitorings });
  } catch (err) {
    logger.error('Failed to get cost monitorings', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getCostMonitoringById(req, res) {
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
  try {
    const result = await CostMonitoring.destroy({
      where: { id: req.params.id },
    });

    if (!result) {
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

module.exports = {
  createCostMonitoring,
  getCostMonitorings,
  getCostMonitoringById,
  deleteCostMonitoring,
  updateCostMonitoring,
};
