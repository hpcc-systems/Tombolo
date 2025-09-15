const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');

//Local imports
const logger = require('../../config/logger');
const { JobMonitoring, JobMonitoringData, Cluster } = require('../../models');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateJobMonitoring,
  validateParamApplicationId,
  validateUpdateJobMonitoring,
  validateEvaluateJobMonitoring,
  validateBulkDeleteJobMonitoring,
  validateDeleteJobMonitoring,
  validateToggleJobMonitoring,
  validateBulkUpdateJobMonitoring,
  validateGetJobMonitoringById,
} = require('../../middlewares/jobMonitoringMiddleware');
const JobScheduler = require('../../jobSchedular/job-scheduler');
const { getUserFkIncludes } = require('../..//utils/getUserFkIncludes');
const { APPROVAL_STATUS } = require('../../config/constants');

//Constants
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
// Create new job monitoring
router.post('/', validate(validateCreateJobMonitoring), async (req, res) => {
  // Handle the POST request here
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

    return res.status(200).send(jobMonitoringWithAssociations);
  } catch (err) {
    logger.error('Failed to save job monitoring: ', err);
    return res.status(500).send('Failed to save job monitoring');
  }
});

// Get all Job monitorings
router.get(
  '/all/:applicationId',
  validate(validateParamApplicationId),
  async (req, res) => {
    try {
      const jobMonitorings = await JobMonitoring.findAll({
        where: { applicationId: req.params.applicationId },
        // Get user association
        include: getCommonIncludes({}),

        order: [['createdAt', 'DESC']],
      });
      return res.status(200).json(jobMonitorings);
    } catch (err) {
      logger.error(err.message);
      return res.status(500).send('Failed to get job monitorings');
    }
  }
);

// Get a single job monitoring
router.get('/:id', async (req, res) => {
  try {
    const jobMonitoring = await JobMonitoring.findOne({
      where: { id: req.params.id },
      include: getCommonIncludes({}),
    });
    return res.status(200).json(jobMonitoring);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send('Failed to get job monitoring');
  }
});

// Patch a single job monitoring
router.patch('/', validate(validateUpdateJobMonitoring), async (req, res) => {
  try {
    // Get existing monitoring
    const existingMonitoring = await JobMonitoring.findByPk(req.body.id);
    if (!existingMonitoring) {
      return res.status(404).send('Job monitoring not found');
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
      return res.status(404).send('Job monitoring not found');
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

    return res.status(200).send(updatedJob);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send('Failed to update job monitoring');
  }
});

// Reject or approve monitoring
router.patch(
  '/evaluate',
  validate(validateEvaluateJobMonitoring),
  async (req, res) => {
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
      return res.status(200).send('Successfully saved your evaluation');
    } catch (err) {
      logger.error(err.message);
      return res.status(500).send('Failed to evaluate job monitoring');
    }
  }
);

// Bulk delete
router.delete(
  '/bulkDelete',
  validate(validateBulkDeleteJobMonitoring),
  async (req, res) => {
    try {
      const response = await JobMonitoring.handleDelete({
        id: req.body.ids,
        deletedByUserId: req.user.id,
      });
      return res.status(200).json(response);
    } catch (err) {
      logger.error(err.message);
      return res.status(500).send('Failed to delete job monitoring');
    }
  }
);

//Delete a single job monitoring
router.delete(
  '/:id',
  validate(validateDeleteJobMonitoring),
  async (req, res) => {
    try {
      await JobMonitoring.handleDelete({
        id: req.params.id,
        deletedByUserId: req.user.id,
      });
      return res.status(200).send('success');
    } catch (err) {
      logger.error(err.message);
      return res.status(500).send('Failed to delete job monitoring');
    }
  }
);

// Toggle job monitoring
router.patch(
  '/toggleIsActive',
  validate(validateToggleJobMonitoring),
  async (req, res) => {
    // Handle the PATCH request here
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
        return res.status(404).send('Job monitorings not found');
      }

      // Filter out the job monitorings that are not approved
      const approvedJobMonitorings = jobMonitorings.filter(
        jobMonitoring =>
          jobMonitoring.approvalStatus === APPROVAL_STATUS.APPROVED
      );

      if (approvedJobMonitorings.length === 0) {
        logger.error(
          'Toggle Job monitoring - No approved job monitorings found'
        );
        return res.status(400).send('No approved job monitorings to toggle'); // Use a valid status code
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

      return res.status(200).send({
        success: true,
        message: 'Toggled successfully',
        updatedJobMonitorings,
      }); // Send the updated job monitorings
    } catch (err) {
      await transaction.rollback();
      logger.error(err.message);
      return res.status(500).send('Failed to toggle job monitoring');
    }
  }
);

// Bulk update - only primary, secondary and notify contact are part of bulk update for now
router.patch(
  '/bulkUpdate',
  validate(validateBulkUpdateJobMonitoring),
  async (req, res) => {
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

      return res.status(200).json({
        success: true,
        message: 'Successfully updated job monitorings',
      });
    } catch (err) {
      logger.error(err.message);
      return res.status(500).send('Failed to update job monitoring');
    }
  }
);

// Get Job Monitoring Data by JM ID
router.get(
  '/data/:id',
  validate(validateGetJobMonitoringById),
  async (req, res) => {
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
      return res.status(200).json(sortedTopLevelInfo);
    } catch (err) {
      logger.error(err.message);
      return res.status(500).send('Failed to get job monitoring data');
    }
  }
);
// Export the router
module.exports = router;
