const express = require('express');
const router = express.Router();
const assert = require('assert');
let Sequelize = require('sequelize');
const Op = Sequelize.Op;
var models  = require('../../models');
const assetUtil = require('../../utils/assets');
let Index = models.indexes;
let IndexKey = models.index_key;
let IndexPayload = models.index_payload;
let Dataflow = models.dataflow;
let AssetsGroups = models.assets_groups;
let File=models.file;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');

router.get('/index_list',
  [
    query('application_id').isUUID(4).withMessage('Invalid application id'),
    query('cluster_id').isUUID(4).optional({ nullable: true }).withMessage('Invalid cluster id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const { application_id, cluster_id } = req.query;

      if (!cluster_id) {
        const assets = await Index.findAll({
          where: { application_id },
          attributes: ['application_id', 'id', 'title', 'description', 'createdAt'],
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

      const assetList = assets.map((asset) => {
        const parsed = asset.toJSON();
        parsed.isAssociated = true;
        return parsed;
      });

      res.json(assetList);
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: 'Error occurred while retrieving assets' });
    }
});

let updateIndexDetails = (indexId, applicationId, req) => {
  return new Promise((resolve, reject) => {
    fieldsToUpdate = {"index_id":indexId, "application_id":applicationId};
    var indexKeyToSave = updateCommonData(req.body.index.indexKey, fieldsToUpdate);
    indexKeyToSave = indexKeyToSave.map((key => {delete key.id; return key}));
    IndexKey.destroy({where:{application_id:applicationId, "index_id":indexId}}).then((deleted) => {
      IndexKey.bulkCreate(indexKeyToSave).then((indexCreateResult) => {
        var indexPayloadToSave = updateCommonData(req.body.index.indexPayload, fieldsToUpdate);
        indexPayloadToSave = indexPayloadToSave.map((payload => {delete payload.id; return payload}));
        console.log('indexPayloadToSave: '+JSON.stringify(indexPayloadToSave))
        IndexPayload.destroy({where:{application_id:applicationId, "index_id":indexId}}).then((deleted) => {
          IndexPayload.bulkCreate(indexPayloadToSave).then((indexPayloadCreateResults) => {
            resolve({"result":"success", "title":req.body.index.basic.title, "indexId":indexId})
          }).catch((err) => {
            reject(err);
          })
        }).catch((err) => {
          reject(err);
        })
      }).catch((err) => {
        reject(err);
      })
    }).catch((err) => {
      reject(err);
    })
  })
}

router.post('/saveIndex', [
  body('id')
  .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid id'),
  body('index.basic.application_id')
    .isUUID(4).withMessage('Invalid application id'),
  body('index.basic.title')
  .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid title')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[saveIndex/read.js] - Get index list for app_id = " + req.body.index.basic._id);
  var index_id, fieldsToUpdate={}, applicationId=req.body.index.basic.application_id;

  Index.findOne({where: {name: req.body.index.basic.name, application_id: applicationId}}).then(async (existingFile) => {
    let index = null;
    if(!existingFile) {
      index = await Index.create(req.body.index.basic);
    } else {
      index = await Index.update(req.body.index.basic, {where:{application_id: applicationId, id:req.body.id}}).then((updatedIndex) => {
        return updatedIndex;
      })
    }
    let indexId = index.id ? index.id : req.body.id;
    console.log("indexId: "+indexId);
    if(req.body.index.basic && req.body.index.basic.groupId) {
      let assetsGroups = await AssetsGroups.findOrCreate({
        where: {assetId: indexId, groupId: req.body.index.basic.groupId},
        defaults:{
          assetId: indexId,
          groupId: req.body.index.basic.groupId
        }
      })
    }
    updateIndexDetails(indexId, applicationId, req).then((response) => {
      res.json(response);
    })
  })
});

router.get('/index_details', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('index_id')
    .isUUID(4).withMessage('Invalid id'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[index_details/read.js] - Get index details for app_id = " + req.query.app_id + " and index_id "+req.query.index_id);
  var basic = {}, results={};
  try {
    assetUtil.indexInfo(req.query.app_id, req.query.index_id).then((indexInfo) => {
      if(indexInfo && indexInfo.basic) {
        res.json(indexInfo);
      } else {
        return res.status(500).json({ success: false, message: "Index details not found. Please check if the index exists in Assets." });
      }

    })
    .catch(function(err) {
      console.log(err);
    });
  } catch (err) {
    console.log('err', err);
  }
});

router.post('/delete', [
  body('indexId')
    .isUUID(4).withMessage('Invalid index id'),
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
],(req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log("[delete/read.js] - Get file list for indexId = " + req.body.indexId + " appId: "+req.body.application_id);
    try {
        Index.destroy(
            {where:{id: req.body.indexId, application_id: req.body.application_id}}
        ).then(function(deleted) {
            IndexKey.destroy(
                {where:{ index_id: req.body.indexId }}
            ).then(function(layoutDeleted) {
                IndexPayload.destroy(
                    {where:{index_id: req.body.indexId}}
                ).then(function(payloadDeleted) {
                    res.json({"result":"success"});
                })
            });
        });
    } catch (err) {
        console.log('err', err);
    }
});

function updateCommonData(objArray, fields) {
    Object.keys(fields).forEach(function (key, index) {
        objArray.forEach(function(obj) {
            obj[key] = fields[key];
        });
    });
    return objArray;
}

module.exports = router;