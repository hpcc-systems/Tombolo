const express = require('express');
const router = express.Router();
const jobScheduler = require('../../jobSchedular/job-scheduler');
const { body, query, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');

router.get('/all', async (req, res) => {
  try {
    const breeJobs = jobScheduler.getAllJobs();
    return res.status(200).send({ jobs: breeJobs });
  } catch (error) {
    logger.error('Something went wrong', error);
    return res.status(500).json({ message: error.message });
  }
});

router.put(
  '/stop_job',
  [body('name').notEmpty().isString()],
  async (req, res) => {
    // Express validator
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });
    // Route logic
    const jobName = req.body.name;
    try {
      const result = await jobScheduler.stopJob(jobName);
      return res.status(200).send(result);
    } catch (error) {
      logger.error('Something went wrong', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  '/start_job',
  [body('name').notEmpty().isString()],
  async (req, res) => {
    // Express validator
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });
    // Route logic
    const jobName = req.body.name;
    try {
      const result = jobScheduler.startJob(jobName);
      return res.status(200).send(result);
    } catch (error) {
      logger.error('Something went wrong', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.delete(
  '/remove_job',
  [query('name').notEmpty().isString()],
  async (req, res) => {
    // Express validator
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });
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
