const express = require('express');
const router = express.Router();
const {
  indexes: Index,
  index_key: IndexKey,
  index_payload: IndexPayload,
  AssetsGroup,
} = require('../../models');
const assetUtil = require('../../utils/assets');

const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateIndexList,
  validateSaveIndex,
  validateIndexDetails,
  validateDeleteIndex,
} = require('../../middlewares/indexMiddleware');
const logger = require('../../config/logger');

router.get('/index_list', validate(validateIndexList), async (req, res) => {
  try {
    const { application_id, cluster_id } = req.query;

    if (!cluster_id) {
      const assets = await Index.findAll({
        where: { application_id },
        attributes: [
          'application_id',
          'id',
          'title',
          'description',
          'createdAt',
        ],
      });
      return res.json(assets);
    }

    const assets = await Index.findAll({
      where: {
        application_id,
        // [Op.or]: [{ cluster_id }, { cluster_id: null }], // ?? doe not have cluster ID
      },
      attributes: ['id', 'title', 'description', 'createdAt'],
    });

    const assetList = assets.map(asset => {
      const parsed = asset.toJSON();
      parsed.isAssociated = true;
      return parsed;
    });

    return res.json(assetList);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error occurred while retrieving assets',
    });
  }
});

let updateIndexDetails = (indexId, applicationId, req) => {
  return new Promise((resolve, reject) => {
    fieldsToUpdate = { index_id: indexId, application_id: applicationId };
    var indexKeyToSave = updateCommonData(
      req.body.index.indexKey,
      fieldsToUpdate
    );
    indexKeyToSave = indexKeyToSave.map(key => {
      delete key.id;
      return key;
    });
    IndexKey.destroy({
      where: { application_id: applicationId, index_id: indexId },
    })
      .then(deleted => {
        IndexKey.bulkCreate(indexKeyToSave)
          .then(indexCreateResult => {
            var indexPayloadToSave = updateCommonData(
              req.body.index.indexPayload,
              fieldsToUpdate
            );
            indexPayloadToSave = indexPayloadToSave.map(payload => {
              delete payload.id;
              return payload;
            });

            logger.verbose(
              'indexPayloadToSave: ' + JSON.stringify(indexPayloadToSave)
            );

            IndexPayload.destroy({
              where: { application_id: applicationId, index_id: indexId },
            })
              .then(deleted => {
                IndexPayload.bulkCreate(indexPayloadToSave)
                  .then(indexPayloadCreateResults => {
                    resolve({
                      result: 'success',
                      title: req.body.index.basic.title,
                      indexId: indexId,
                    });
                  })
                  .catch(err => {
                    reject(err);
                  });
              })
              .catch(err => {
                reject(err);
              });
          })
          .catch(err => {
            reject(err);
          });
      })
      .catch(err => {
        reject(err);
      });
  });
};

router.post('/saveIndex', validate(validateSaveIndex), async (req, res) => {
  try {
    const { application_id } = req.body.index.basic;
    let index = await Index.findOne({
      where: { name: req.body.index.basic.name, application_id },
    });
    if (!index) {
      // Create
      index = await Index.create(req.body.index.basic);

      if (req.body.index.basic.groupId) {
        const { groupId } = req.body.index.basic.groupId;
        await AssetsGroup.findOrCreate({
          where: { assetId: index.id, groupId: groupId },
          defaults: { assetId: index.id, groupId },
        });
      }
    } else {
      // Update
      await Index.update(req.body.index.basic, {
        where: { application_id, id: req.body.id },
      });
    }
    index = index.toJSON();
    await updateIndexDetails(index.id, application_id, req);
    return res.status(200).json({ success: true, message: 'Save successful' });
  } catch (err) {
    logger.error(err);
    return res.status(503).json({ success: false, message: err.message });
  }
});

router.get(
  '/index_details',
  validate(validateIndexDetails),
  async (req, res) => {
    try {
      const indexInfo = await assetUtil.indexInfo(
        req.query.app_id,
        req.query.index_id
      );
      if (indexInfo && indexInfo.basic) {
        return res.status(200).json(indexInfo);
      }

      throw new Error(
        'Index details not found. Please check if the index exists in Assets.'
      );
    } catch (err) {
      logger.error(err);
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

router.post('/delete', validate(validateDeleteIndex), async (req, res) => {
  try {
    await Index.destroy({
      where: {
        id: req.body.indexId,
        application_id: req.body.application_id,
      },
    });
    await IndexKey.destroy({ where: { index_id: req.body.indexId } });
    await IndexPayload.destroy({ where: { index_id: req.body.indexId } });

    return res.status(200).json({ result: 'success' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Failed to delete index' });
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
