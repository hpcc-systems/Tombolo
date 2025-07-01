const express = require('express');
const router = express.Router();
var {
  query: Query,
  query_field: QueryField,
  assets_groups: AssetsGroups,
} = require('../../models');
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');

let updateQueryDetails = async (queryId, applicationId, req) => {
  let fieldsToUpdate = { query_id: queryId, application_id: applicationId };
  var queryFieldToSave = updateCommonData(
    req.body.query.fields,
    fieldsToUpdate
  );

  await QueryField.destroy({
    where: { query_id: queryId, application_id: applicationId },
  });
  await QueryField.bulkCreate(queryFieldToSave, {
    updateOnDuplicate: ['field_type', 'name', 'type'],
  });

  return {
    result: 'success',
    title: req.body.query.basic.title,
    queryId: queryId,
  };
};

router.post(
  '/saveQuery',
  [
    body('id')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid id'),
    body('query.basic.application_id')
      .isUUID(4)
      .withMessage('Invalid application id'),
    body('query.basic.name')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid name'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const applicationId = req.body.query.basic.application_id;
    try {
      const existingQuery = await Query.findOne({
        where: {
          name: req.body.query.basic.name,
          application_id: applicationId,
        },
      });

      let query;

      if (!existingQuery) query = await Query.create(req.body.query.basic);
      else {
        const updatedQuery = await Query.update(req.body.query.basic, {
          where: { application_id: applicationId, id: req.body.id },
        });
        query = updatedQuery;
      }

      let queryId = query.id ? query.id : req.body.id;
      if (req.body.query.basic && req.body.query.basic.groupId) {
        await AssetsGroups.findOrCreate({
          where: { assetId: queryId, groupId: req.body.query.basic.groupId },
          defaults: {
            assetId: queryId,
            groupId: req.body.query.basic.groupId,
          },
        });
      }

      const response = await updateQueryDetails(queryId, applicationId, req);

      return res.status(200).json(response);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Error occured while saving Query');
    }
  }
);

router.get(
  '/query_list',
  [query('app_id').isUUID(4).withMessage('Invalid application id')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const queries = await Query.findAll({
        where: { application_id: req.query.app_id },
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json(queries);
    } catch (err) {
      logger.error(err);
      return res.status(500).json({ message: 'Failed to get query list' });
    }
  }
);

router.get(
  '/query_details',
  [
    query('app_id').isUUID(4).withMessage('Invalid application id'),
    query('query_id').isUUID(4).withMessage('Invalid query id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const query = await Query.findOne({
        where: { application_id: req.query.app_id, id: req.query.query_id },
        include: [QueryField],
      });

      return res.status(200).json(query);
    } catch (err) {
      logger.error(err);
      return res.status(500).json({ message: 'Failed to get query details' });
    }
  }
);

router.post(
  '/delete',
  [
    body('application_id').isUUID(4).withMessage('Invalid application id'),
    body('queryId').isUUID(4).withMessage('Invalid query id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      await Query.destroy({
        where: {
          id: req.body.queryId,
          application_id: req.body.application_id,
        },
      });

      await QueryField.destroy({ where: { query_id: req.body.queryId } });

      return res.status(200).json({ result: 'success' });
    } catch (err) {
      logger.error(err);
      return res.status(500).json({ message: 'Failed to delete query' });
    }
  }
);

function updateCommonData(objArray, fields) {
  Object.keys(fields).forEach(function (key) {
    objArray.forEach(function (obj) {
      obj[key] = fields[key];
    });
  });
  return objArray;
}

module.exports = router;
