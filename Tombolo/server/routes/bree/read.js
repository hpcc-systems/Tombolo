const express = require('express');
const router = express.Router();
const jobScheduler = require('../../jobSchedular/job-scheduler');
const { body, query } = require('express-validator');
const { validate } = require('../../middlewares/validateRequestBody');
const logger = require('../../config/logger');

const validateName = [body('name').notEmpty().isString()];

router.get('/all', async (req, res) => {
  try {
    const breeJobs = jobScheduler.getAllJobs();
    return res.status(200).send({ jobs: breeJobs });
  } catch (error) {
    logger.error('Something went wrong', error);
    return res.status(500).json({ message: error.message });
  }
});

router.put('/stop_job', validate(validateName), async (req, res) => {
  // Route logic
  const jobName = req.body.name;
  try {
    const result = await jobScheduler.stopJob(jobName);
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Something went wrong', error);
    return res.status(500).json({ message: error.message });
  }
});

router.put('/start_job', validate(validateName), async (req, res) => {
  // Route logic
  const jobName = req.body.name;
  try {
    const result = jobScheduler.startJob(jobName);
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Something went wrong', error);
    return res.status(500).json({ message: error.message });
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
      return res.status(200).send(result);
    } catch (error) {
      logger.error('Something went wrong', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.put('/start_all', async (req, res) => {
  // Route logic
  try {
    const result = jobScheduler.startAllJobs();
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Something went wrong', error);
    return res.status(500).json({ message: error.message });
  }
});

router.put('/stop_all', async (req, res) => {
  // Route logic
  try {
    const result = await jobScheduler.stopAllJobs();
    return res.status(200).send(result);
  } catch (error) {
    logger.error('Something went wrong', error);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
