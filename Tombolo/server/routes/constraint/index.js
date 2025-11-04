const express = require('express');
const { body, param, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');
const logger = require('../../config/logger');
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require('../../utils/response');
const router = express.Router();

const { Constraint, File } = require('../../models');

router.get('/', async (req, res) => {
  try {
    const constraints = await Constraint.findAll();
    return sendSuccess(res, constraints);
  } catch (error) {
    logger.error('Get constraints error:', error);
    return sendError(res, error.message);
  }
});

router.delete('/:id', [param('id').isUUID(4)], async (req, res) => {
  try {
    // Express validator
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());
    // Route logic

    const { id } = req.params;

    const isRemoved = await Constraint.destroy({ where: { id } });
    if (!isRemoved)
      return sendError(
        res,
        'Constraint was not found or could not be removed',
        404
      );

    const files = await File.findAll();

    for (let file of files) {
      // remove contraint from file;

      if (file.metaData.constraints && file.metaData.constraints.length > 0) {
        file.metaData.constraints = file.metaData.constraints.filter(
          el => el !== id
        );
      }

      if (file.metaData.layout && file.metaData.layout.length > 0) {
        for (const field of file.metaData.layout) {
          field.constraints.own = field.constraints.own.filter(
            el => el.id !== id
          );
          field.constraints.inherited = field.constraints.inherited.filter(
            el => el.id !== id
          );
        }
      }

      let updated = await File.update(
        { metaData: file.toJSON().metaData },
        { where: { id: file.id } }
      );
      logger.info('-file: -----------------------------------------');
      logger.info(updated);
      logger.info('------------------------------------------');
    }

    return sendSuccess(res, { id }, 'Constraint deleted successfully');
  } catch (error) {
    logger.error('Delete constraint error:', error);
    return sendError(res, error.message);
  }
});

router.post(
  '/',
  [
    body('id').optional({ checkFalsy: true }).isUUID(4),
    body('name').isString().notEmpty().escape().trim(),
    body('short_description').optional({ checkFalsy: true }).escape().trim(),
    body('description').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res) => {
    // Express validator
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());
    // Route logic
    try {
      const constraint = req.body;

      if (!constraint.id) {
        const newContraint = await Constraint.create(constraint);
        return sendSuccess(
          res,
          newContraint,
          'Constraint created successfully'
        );
      } else {
        const { id, ...restFields } = constraint;

        const existingContraint = await Constraint.findOne({ where: { id } });
        if (!existingContraint)
          return sendError(res, 'Constraint does not exist', 404);

        const updated = await existingContraint.update(restFields);

        return sendSuccess(res, updated, 'Constraint updated successfully');
      }
    } catch (error) {
      logger.error('Create/Update constraint error:', error);
      return sendError(res, error.message);
    }
  }
);

module.exports = router;
