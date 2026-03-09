import express from 'express';
const router = express.Router();
import jobScheduler from '../../jobSchedular/job-scheduler.js';
import { body, query } from 'express-validator';
import { validate } from '../../middlewares/validateRequestBody.js';
import logger from '../../config/logger.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const validateName = [body('name').notEmpty().isString()];

router.get('/all', async (req, res) => {
  try {
    const breeJobs = jobScheduler.getAllJobs();
    return sendSuccess(
      res,
      { jobs: breeJobs },
      'Bree jobs retrieved successfully'
    );
  } catch (error) {
    logger.error('Something went wrong', error);
    return sendError(res, error);
  }
});

router.put('/stop_job', validate(validateName), async (req, res) => {
  // Route logic
  const jobName = req.body.name;
  try {
    const result = await jobScheduler.stopJob(jobName);
    return sendSuccess(res, result, 'Job stopped successfully');
  } catch (error) {
    logger.error('Something went wrong', error);
    return sendError(res, error);
  }
});

router.put('/start_job', validate(validateName), async (req, res) => {
  // Route logic
  const jobName = req.body.name;
  try {
    const result = jobScheduler.startJob(jobName);
    return sendSuccess(res, result, 'Job started successfully');
  } catch (error) {
    logger.error('Something went wrong', error);
    return sendError(res, error);
  }
});

router.delete(
  '/remove_job',
  validate([query('name').notEmpty().isString()]),
  async (req, res) => {
    // Route logic
    const jobName = req.query.name;
    try {
      const result = await jobScheduler.removeJobFromScheduler(jobName);
      return sendSuccess(res, result, 'Job removed successfully');
    } catch (error) {
      logger.error('Something went wrong', error);
      return sendError(res, error);
    }
  }
);

router.put('/start_all', async (req, res) => {
  // Route logic
  try {
    const result = jobScheduler.startAllJobs();
    return sendSuccess(res, result, 'All jobs started successfully');
  } catch (error) {
    logger.error('Something went wrong', error);
    return sendError(res, error);
  }
});

router.put('/stop_all', async (req, res) => {
  // Route logic
  try {
    const result = await jobScheduler.stopAllJobs();
    return sendSuccess(res, result, 'All jobs stopped successfully');
  } catch (error) {
    logger.error('Something went wrong', error);
    return sendError(res, error);
  }
});

export default router;
