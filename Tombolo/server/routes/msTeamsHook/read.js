const express = require('express');
const router = express.Router();

const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateMsTeamsHook,
  validateUpdateMsTeamsHook,
  validateDeleteMsTeamsHook,
} = require('../../middlewares/msTeamsHookMiddleware');
const logger = require('../../config/logger');
const { sendSuccess, sendError } = require('../../utils/response');
const { TeamsHook } = require('../../models');

// GET all teams hooks
router.get('/', async (req, res) => {
  try {
    const response = await TeamsHook.findAll({ raw: true });
    return sendSuccess(res, response);
  } catch (err) {
    logger.error('getMsTeamsHook: ', err);
    return sendError(res, 'Error while fetching teams hooks. Try again later.');
  }
});

// POST create teams hook
router.post('/', validate(validateCreateMsTeamsHook), async (req, res) => {
  try {
    const response = await TeamsHook.create(req.body);
    return sendSuccess(res, response, 'Teams hook created successfully');
  } catch (err) {
    logger.error('createMsTeamsHook: ', err);
    return sendError(res, 'Error while creating teams hook. Try again later.');
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
      return sendSuccess(res, response, 'Teams hook updated successfully');
    } catch (err) {
      logger.error('updateMsTeamsHook: ', err);
      return sendError(
        res,
        'Error while updating teams hook. Try again later.'
      );
    }
  }
);

// DELETE delete teams hook
router.delete('/:id', validate(validateDeleteMsTeamsHook), async (req, res) => {
  try {
    await TeamsHook.destroy({
      where: { id: req.params.id },
    });
    return sendSuccess(res, null, 'Teams hook deleted successfully');
  } catch (err) {
    logger.error('deleteMsTeamsHook: ', err);
    return sendError(res, 'Error while deleting teams hook. Try again later.');
  }
});

module.exports = router;
