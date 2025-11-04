const express = require('express');
const router = express.Router();
const logger = require('../../config/logger');
const { Query, QueryField, AssetsGroup } = require('../../models');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/response');
const {
  validateSaveQuery,
  validateQueryList,
  validateQueryDetails,
  validateDeleteQuery,
} = require('../../middlewares/queryMiddleware');
const { validate } = require('../../middlewares/validateRequestBody');

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

router.post('/saveQuery', validate(validateSaveQuery), async (req, res) => {
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
      await AssetsGroup.findOrCreate({
        where: { assetId: queryId, groupId: req.body.query.basic.groupId },
        defaults: {
          assetId: queryId,
          groupId: req.body.query.basic.groupId,
        },
      });
    }

    const response = await updateQueryDetails(queryId, applicationId, req);

    return sendSuccess(res, response, 'Query saved successfully');
  } catch (err) {
    logger.error('query/read - saveQuery: ', err);
    return sendError(res, 'Error occurred while saving Query', 500);
  }
});

router.get('/query_list', validate(validateQueryList), async (req, res) => {
  try {
    const queries = await Query.findAll({
      where: { application_id: req.query.app_id },
      order: [['createdAt', 'DESC']],
    });

    return sendSuccess(res, queries, 'Query list retrieved successfully');
  } catch (err) {
    logger.error('query/read - query_list: ', err);
    return sendError(res, 'Failed to get query list', 500);
  }
});

router.get(
  '/query_details',
  validate(validateQueryDetails),
  async (req, res) => {
    try {
      const query = await Query.findOne({
        where: { application_id: req.query.app_id, id: req.query.query_id },
        include: [QueryField],
      });

      return sendSuccess(res, query, 'Query details retrieved successfully');
    } catch (err) {
      logger.error('query/read - query_details: ', err);
      return sendError(res, 'Failed to get query details', 500);
    }
  }
);

router.post('/delete', validate(validateDeleteQuery), async (req, res) => {
  try {
    await Query.destroy({
      where: {
        id: req.body.queryId,
        application_id: req.body.application_id,
      },
    });

    await QueryField.destroy({ where: { query_id: req.body.queryId } });

    return sendSuccess(res, { result: 'success' }, 'Query deleted successfully');
  } catch (err) {
    logger.error('query/read - delete: ', err);
    return sendError(res, 'Failed to delete query', 500);
  }
});

function updateCommonData(objArray, fields) {
  Object.keys(fields).forEach(function (key) {
    objArray.forEach(function (obj) {
      obj[key] = fields[key];
    });
  });
  return objArray;
}

module.exports = router;
