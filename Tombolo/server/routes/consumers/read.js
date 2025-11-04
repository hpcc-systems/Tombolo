const express = require('express');
const router = express.Router();
const { Consumer } = require('../../models');
const { body, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');
const logger = require('../../config/logger');
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require('../../utils/response');

router.get('/consumers', async (req, res) => {
  try {
    const consumers = await Consumer.findAll({
      order: [['createdAt', 'DESC']],
    });
    return sendSuccess(res, consumers);
  } catch (err) {
    logger.error('consumers/read getConsumers: ', err);
    return sendError(res, err.message || err);
  }
});

router.post(
  '/consumer',
  [body('contact_email').isEmail().withMessage('Invalid E-mail')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const result = await Consumer.findOrCreate({
        where: { name: req.body.name },
        defaults: req.body,
      });

      if (!result[1]) {
        await Consumer.update(req.body, {
          where: { name: req.body.name },
        });
      }

      return sendSuccess(res, null, 'Consumer saved successfully');
    } catch (err) {
      logger.error('consumers/read createConsumer: ', err);
      return sendError(res, 'Error occurred while saving Consumer information');
    }
  }
);

router.get('/consumer', async (req, res) => {
  logger.verbose(
    '[consumer details/read.js] - Get index details for app_id = ' +
      req.query.consumer_id
  );
  try {
    const consumer = await Consumer.findOne({
      where: { id: req.query.consumer_id },
    });
    return sendSuccess(res, { consumer });
  } catch (err) {
    logger.error('consumers/read getConsumer: ', err);
    return sendError(res, err.message || err);
  }
});

router.post('/delete', async (req, res) => {
  try {
    const deleted = await Consumer.destroy({
      where: { id: req.body.consumerToDelete },
    });
    if (!deleted) return sendError(res, 'Consumer not found', 404);
    return sendSuccess(res, null, 'Consumer deleted successfully');
  } catch (err) {
    logger.error('consumers/read deleteConsumer: ', err);
    return sendError(res, err.message);
  }
});

module.exports = router;
