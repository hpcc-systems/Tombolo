const Sequelize = require('sequelize');

//Local imports
const logger = require('../config/logger');
const { sendError, sendSuccess } = require('../utils/response');
const { JobMonitoring, JobMonitoringData, Cluster } = require('../models');
const JobScheduler = require('../jobSchedular/job-scheduler');
const { getUserFkIncludes } = require('../utils/getUserFkIncludes');
const { APPROVAL_STATUS } = require('../config/constants');

const Op = Sequelize.Op;

const getCommonIncludes = ({ customIncludes = [] }) => {
  return [
    ...getUserFkIncludes(true),
    {
      model: Cluster,
      attributes: ['id', 'name', 'thor_host', 'thor_port'],
    },
    ...customIncludes,
  ];
};

async function createJobMonitoring(req, res) {
  try {
    //Save the job monitoring
    const response = await JobMonitoring.create(
      {
        ...req.body,
        approvalStatus: APPROVAL_STATUS.PENDING,
        createdBy: req.user.id,
      },
      { raw: true }
    );

    // re fetch with associations
    const jobMonitoringWithAssociations = await JobMonitoring.findByPk(
      response.id,
      { include: getCommonIncludes({}) }
    );

    // If TimeSeriesAnalysis is part of the notification condition, create a job to fetch WU info (Runs in background)
    const {
      metaData: {
        notificationMetaData: { notificationCondition },
      },
    } = req.body;

    if (notificationCondition.includes('TimeSeriesAnalysis')) {
      JobScheduler.createWuInfoFetchingJob({
        clusterId: req.body.clusterId,
        jobName: req.body.jobName,
        monitoringId: response.id,
        applicationId: req.body.applicationId,
      });
    }

    return sendSuccess(res, jobMonitoringWithAssociations);
  } catch (err) {
    logger.error('Failed to save job monitoring: ', err);
    return sendError(res, 'Failed to save job monitoring');
  }
}

async function getAllJobMonitorings(req, res) {
  try {
    const jobMonitorings = await JobMonitoring.findAll({
      where: { applicationId: req.params.applicationId },
      // Get user association
      include: getCommonIncludes({}),

      order: [['createdAt', 'DESC']],
    });
    return sendSuccess(res, jobMonitorings);
  } catch (err) {
    logger.error(err.message);
    return sendError(res, 'Failed to get job monitorings');
  }
}

async function getJobMonitoringById(req, res) {
  try {
    const jobMonitoring = await JobMonitoring.findOne({
      where: { id: req.params.id },
      include: getCommonIncludes({}),
    });
    return sendSuccess(res, jobMonitoring);
  } catch (err) {
    logger.error(err.message);
    return sendError(res, 'Failed to get job monitoring');
  }
}

async function patchJobMonitoring(req, res) {
  try {
    // Get existing monitoring
    const existingMonitoring = await JobMonitoring.findByPk(req.body.id);
    if (!existingMonitoring) {
      return sendError(res, 'Job monitoring not found', 404);
    }

    const {
      clusterId: existingClusterId,
      jobName: existingJobName,
      metaData: {
        notificationMetaData: {
          notificationCondition: existingNotificationConditions,
        },
      },
    } = existingMonitoring;
    const {
      metaData: {
        notificationMetaData: { notificationCondition },
      },
    } = req.body;

    const clusterIdIsDifferent = req.body.clusterId !== existingClusterId;
    const jobNameIsDifferent = req.body.jobName !== existingJobName;
    const timeSeriesAnalysisAdded =
      !existingNotificationConditions.includes('TimeSeriesAnalysis') &&
      req.body.metaData.notificationMetaData.notificationCondition.includes(
        'TimeSeriesAnalysis'
      );

    //Payload
    const payload = req.body;
    payload.approvalStatus = APPROVAL_STATUS.PENDING;
    payload.approverComment = null;
    payload.approvedBy = null;
    payload.approvedAt = null;
    payload.isActive = false;
    payload.updatedBy = req.user.id;

    //Update the job monitoring
    const updatedRows = await JobMonitoring.update(req.body, {
      where: { id: req.body.id },
      returning: true,
    });

    //If no rows were updated, then the job monitoring does not exist
    if (updatedRows[0] === 0) {
      return sendError(res, 'Job monitoring not found', 404);
    }

    //If updated - Get the updated job monitoring
    const updatedJob = await JobMonitoring.findOne({
      where: { id: req.body.id },
      include: getCommonIncludes({}),
    });

    // If the clusterId or jobName has changed, update the JobMonitoringData table ( Happens in background)

    if (
      (clusterIdIsDifferent || jobNameIsDifferent || timeSeriesAnalysisAdded) &&
      notificationCondition.includes('TimeSeriesAnalysis')
    ) {
      // Delete existing job monitoring data permanently
      await JobMonitoringData.destroy({
        where: { monitoringId: req.body.id },
        force: true,
      });

      // Re-fetch must happen
      JobScheduler.createWuInfoFetchingJob({
        clusterId: req.body.clusterId,
        jobName: req.body.jobName,
        monitoringId: req.body.id,
        applicationId: req.body.applicationId,
      });
    }

    return sendSuccess(res, updatedJob);
  } catch (err) {
    logger.error(err.message);
    return sendError(res, 'Failed to update job monitoring');
  }
}

async function evaluateJobMonitoring(req, res) {
  try {
    const { ids, approverComment, approvalStatus, isActive } = req.body;
    await JobMonitoring.update(
      {
        approvalStatus,
        approverComment,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        isActive,
      },
      { where: { id: { [Op.in]: ids } } }
    );
    return sendSuccess(res, 'Successfully saved your evaluation');
  } catch (err) {
    logger.error(err.message);
    return sendError(res, 'Failed to evaluate job monitoring');
  }
}

async function bulkDeleteJobMonitoring(req, res) {
  try {
    const response = await JobMonitoring.handleDelete({
      id: req.body.ids,
      deletedByUserId: req.user.id,
    });
    return sendSuccess(res, response);
  } catch (err) {
    logger.error(err.message);
    return sendError(res, 'Failed to delete job monitoring');
  }
}

async function deleteJobMonitoring(req, res) {
  try {
    await JobMonitoring.handleDelete({
      id: req.params.id,
      deletedByUserId: req.user.id,
    });
    return sendSuccess(res, 'success');
  } catch (err) {
    logger.error(err.message);
    return sendError(res, 'Failed to delete job monitoring');
  }
}

async function toggleJobMonitoring(req, res) {
  let transaction;

  try {
    transaction = await JobMonitoring.sequelize.transaction();
    const { ids, action } = req.body; // Expecting an array of IDs

    // Find all job monitorings with the given IDs
    const jobMonitorings = await JobMonitoring.findAll({
      where: { id: { [Op.in]: ids } },
    });

    if (jobMonitorings.length === 0) {
      logger.error('Toggle Job monitoring - Job monitorings not found');
      return sendError(res, 'Job monitorings not found', 404);
    }

    // Filter out the job monitorings that are not approved
    const approvedJobMonitorings = jobMonitorings.filter(
      jobMonitoring => jobMonitoring.approvalStatus === 'Approved' // Issue created to use Constant
    );

    if (approvedJobMonitorings.length === 0) {
      logger.error('Toggle Job monitoring - No approved job monitorings found');
      return sendError(res, 'No approved job monitorings to toggle', 400);
    }

    // Get the IDs of the approved job monitorings
    const approvedIds = approvedJobMonitorings.map(
      jobMonitoring => jobMonitoring.id
    );

    if (action) {
      // If action is start or pause change isActive to true or false respectively
      await JobMonitoring.update(
        { isActive: action === 'start', updatedBy: req.user.id },
        {
          where: { id: { [Op.in]: approvedIds } },
          transaction,
        }
      );
    } else {
      // Toggle the isActive status for all approved job monitorings
      await JobMonitoring.update(
        {
          isActive: Sequelize.literal('NOT isActive'),
          updatedBy: req.user.id,
        },
        {
          where: { id: { [Op.in]: approvedIds } },
          transaction,
        }
      );
    }

    await transaction.commit();

    // Get all updated job monitorings
    const updatedJobMonitorings = await JobMonitoring.findAll({
      where: { id: { [Op.in]: approvedIds } },
      include: getCommonIncludes({}),
    });

    return sendSuccess(res, {
      success: true,
      message: 'Toggled successfully',
      updatedJobMonitorings,
    }); // Send the updated job monitorings
  } catch (err) {
    try {
      if (transaction) {
        await transaction.rollback();
      }
    } catch (rollbackErr) {
      logger.error('Failed to rollback transaction:', rollbackErr.message);
    }
    logger.error(err.message);
    return sendError(res, 'Failed to toggle job monitoring');
  }
}

async function bulkUpdateJobMonitoring(req, res) {
  try {
    const { metaData: payload } = req.body;

    for (const data of payload) {
      await JobMonitoring.update(
        {
          metaData: data.metaData,
          isActive: false,
          approvalStatus: APPROVAL_STATUS.PENDING,
          updatedBy: req.user.id,
        },
        {
          where: { id: data.id },
        }
      );
    }

    return sendSuccess(res, {
      success: true,
      message: 'Successfully updated job monitorings',
    });
  } catch (err) {
    logger.error(err.message);
    return sendError(res, 'Failed to update job monitoring');
  }
}

async function getJobMonitoringData(req, res) {
  const { id } = req.params;

  try {
    const jobMonitoringData = await JobMonitoringData.findAll({
      where: { monitoringId: id },
      // latest ones first
      order: [['createdAt', 'DESC']],
      attributes: ['wuTopLevelInfo'],
      limit: 10,
      raw: true,
    });

    const topLevelInfo = jobMonitoringData.map(data => data.wuTopLevelInfo);

    topLevelInfo.forEach(i => {
      i.sequenceNumber = parseInt(i.Wuid.replace(/W|-/g, ''), 10);
    });

    // sort by sequence number
    const sortedTopLevelInfo = topLevelInfo.sort(
      (a, b) => b.sequenceNumber - a.sequenceNumber
    );
    return sendSuccess(res, sortedTopLevelInfo);
  } catch (err) {
    logger.error(err.message);
    return sendError(res, 'Failed to get job monitoring data');
  }
}

module.exports = {
  getJobMonitoringData,
  bulkUpdateJobMonitoring,
  toggleJobMonitoring,
  deleteJobMonitoring,
  bulkDeleteJobMonitoring,
  evaluateJobMonitoring,
  patchJobMonitoring,
  createJobMonitoring,
  getAllJobMonitorings,
  getJobMonitoringById,
};
