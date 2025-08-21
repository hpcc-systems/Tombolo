const express = require('express');
const router = express.Router();

const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateMsTeamsHook,
  validateUpdateMsTeamsHook,
  validateDeleteMsTeamsHook,
} = require('../../middlewares/msTeamsHookMiddleware');
const logger = require('../../config/logger');
const { TeamsHook } = require('../../models');

// GET all teams hooks
router.get('/', async (req, res) => {
  try {
    const response = await TeamsHook.findAll({ raw: true });
    return res.status(200).send(response);
  } catch (err) {
    logger.error('getMsTeamsHook: ', err);
    return res
      .status(500)
      .send('Error while fetching teams hooks. Try again later.');
  }
});

// POST create teams hook
router.post('/', validate(validateCreateMsTeamsHook), async (req, res) => {
  try {
    const response = await TeamsHook.create(req.body);
    return res.status(200).send(response);
  } catch (err) {
    logger.error('createMsTeamsHook: ', err);
    return res
      .status(500)
      .send('Error while creating teams hook. Try again later.');
  }
});

// PUT edit teams hook
router.patch(
  '/',
  [
    (req, res, next) => {
      if (req.body.createdBy) {
        delete req.body.createdBy;
      }
      next();
    },
    validate(validateUpdateMsTeamsHook),
  ],

  async (req, res) => {
    try {
      const response = await TeamsHook.update(req.body, {
        where: { id: req.body.id },
      });
      return res.status(200).send(response);
    } catch (err) {
      logger.error('updateMsTeamsHook: ', err);
      return res
        .status(500)
        .send('Error while updating teams hook. Try again later.');
    }
  }
);

// DELETE delete teams hook
router.delete('/:id', validate(validateDeleteMsTeamsHook), async (req, res) => {
  try {
    await TeamsHook.destroy({
      where: { id: req.params.id },
    });
    return res.status(200).send('Successfully deleted teams hook');
  } catch (err) {
    logger.error('deleteMsTeamsHook: ', err);
    return res
      .status(500)
      .send('Error while deleting teams hook. Try again later.');
  }
});

module.exports = router;
