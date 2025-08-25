const express = require('express');
const router = express.Router();
const { Consumer } = require('../../models');
const { body, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');
const logger = require('../../config/logger');

router.get('/consumers', async (req, res) => {
  try {
    const consumers = await Consumer.findAll({
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(consumers);
  } catch (err) {
    logger.error('consumers/read getConsumers: ', err);
    return res.status(500).json({ error: err });
  }
});

router.post(
  '/consumer',
  [body('contact_email').isEmail().withMessage('Invalid E-mail')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
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

      return res.status(200).json({ result: 'success' });
    } catch (err) {
      logger.error('consumers/read createConsumer: ', err);
      return res
        .status(500)
        .send('Error occured while saving Consumer information');
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
    return res.status(200).json({ consumer });
  } catch (err) {
    logger.error('consumers/read getConsumer: ', err);
    return res.status(500).json({ error: err });
  }
});

router.post('/delete', async (req, res) => {
  try {
    await Consumer.destroy({ where: { id: req.body.consumerToDelete } });
    return res.status(200).json({ result: 'success ' });
  } catch (err) {
    logger.error('consumers/read deleteConsumer: ', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
