import { CostMonitoring, sequelize } from '../models/index.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';
import { uniqueConstraintErrorHandler } from '../utils/uniqueConstraintErrorHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getUserFkIncludes } from '../utils/getUserFkIncludes.js';
import { APPROVAL_STATUS } from '../config/constants.js';

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
    return sendSuccess(res, result, 'OK', 201);
  } catch (err) {
    logger.error('Failed to create cost monitoring', err);
    const errorResult = uniqueConstraintErrorHandler(err, err.message);
    return sendError(
      res,
      errorResult.responseObject.message || err.message,
      errorResult.statusCode
    );
  }
}

async function updateCostMonitoring(req, res) {
  try {
    const updatedData = { ...req.body, lastUpdatedBy: req.user.id };
    const affected = await CostMonitoring.update(updatedData, {
      where: { id: updatedData.id },
    });

    if (affected[0] === 0) {
      return sendError(res, 'Cost monitoring not found', 404);
    }

    const result = await CostMonitoring.findByPk(updatedData.id, {
      include: getUserFkIncludes(true),
    });

    return sendSuccess(res, result);
  } catch (err) {
    logger.error('Failed to update cost monitoring', err);
    return sendError(res, err.message);
  }
}

async function getCostMonitorings(req, res) {
  try {
    const costMonitorings = await CostMonitoring.findAll({
      where: { applicationId: req.params.applicationId },
      include: getUserFkIncludes(true),
      order: [['createdAt', 'DESC']],
    });
    return sendSuccess(res, costMonitorings);
  } catch (err) {
    logger.error('Failed to get cost monitorings', err);
    return sendError(res, err.message);
  }
}

async function getCostMonitoringById(req, res) {
  try {
    const costMonitoringRecord = await CostMonitoring.findByPk(req.params.id, {
      include: getUserFkIncludes(true),
    });
    if (!costMonitoringRecord) {
      return sendError(res, 'Cost monitoring not found', 404);
    }
    return sendSuccess(res, costMonitoringRecord);
  } catch (err) {
    logger.error('Failed to get cost monitoring by id', err);
    return sendError(res, err.message);
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
      return sendError(res, 'Cost monitoring not found', 404);
    }
    await transaction.commit();

    return sendSuccess(res, null, 'Cost monitoring deleted successfully');
  } catch (err) {
    await transaction.rollback();
    logger.error('Failed to delete cost monitoring', err);
    return sendError(res, err.message);
  }
}

async function evaluateCostMonitoring(req, res) {
  try {
    const { id: approverId } = req.user;
    const approvalStatus = req.body.approvalStatus;
    const isApproved = approvalStatus === APPROVAL_STATUS.APPROVED;
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

    return sendSuccess(
      res,
      result,
      'Cost monitoring(s) evaluated successfully'
    );
  } catch (err) {
    logger.error('Failed to evaluate cost monitoring', err);
    return sendError(res, err.message);
  }
}

async function toggleCostMonitoringActive(req, res) {
  let transaction;
  try {
    transaction = await CostMonitoring.sequelize.transaction();
    const { ids, action } = req.body;
    const { id: userId } = req.user;

    const costMonitorings = await CostMonitoring.findAll({
      where: { id: { [Op.in]: ids }, approvalStatus: APPROVAL_STATUS.APPROVED },
      attributes: ['id', 'approvalStatus'],
    });

    if (costMonitorings.length === 0) {
      logger.error('Toggle Cost monitoring - Cost monitorings not found');
      return sendError(res, 'Cost monitorings not found', 404);
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

    return sendSuccess(
      res,
      { updatedCostMonitorings },
      'Cost monitoring(s) toggled successfully'
    );
  } catch (err) {
    transaction && (await transaction.rollback());
    logger.error('Failed to toggle cost monitoring isActive', err);
    return sendError(res, err.message);
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
    return sendSuccess(res, null, 'Cost monitoring(s) deleted successfully');
  } catch (err) {
    await transaction.rollback();
    logger.error('Failed to bulk delete cost monitoring', err);
    return sendError(res, err.message);
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
    return sendSuccess(res, null, 'Cost monitorings updated successfully');
  } catch (err) {
    transaction && (await transaction.rollback());
    logger.error('Failed to bulk update cost monitoring', err);
    return sendError(res, err.message);
  }
}

export {
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
