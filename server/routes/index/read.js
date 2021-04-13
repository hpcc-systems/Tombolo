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

router.get('/index_list', [
  query('app_id')
    .isUUID(4).withMessage('Invalid app id'),
  query('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log("[index/read.js] - Get file list for app_id = " + req.query.app_id);
    let dataflowId = req.query.dataflowId;
    let query = 'select i.id, i.name, i.title, i.createdAt, asd.dataflowId from indexes i '+
    'left join assets_dataflows asd '+
    'on i.id = asd.assetId '+
    'where i.application_id=(:applicationId) '+
    'and i.id not in (select assetId from assets_dataflows where dataflowId = (:dataflowId)) group by i.id order by i.name asc';
    /*let query = 'select j.id, j.name, j.title, j.createdAt, asd.dataflowId from job j, assets_dataflows asd where j.application_id=(:applicationId) '+
        'and j.id = asd.assetId and j.id not in (select assetId from assets_dataflows where dataflowId = (:dataflowId))';*/
    let replacements = { applicationId: req.query.app_id, dataflowId: dataflowId};
    let existingFile = models.sequelize.query(query, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: replacements
    }).then((indexes) => {
      res.json(indexes);
    })
    .catch(function(err) {
      return res.status(500).json({ success: false, message: "Error occured while retrieving indexes" });
    });
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
    assetUtil.indexInfo(req.query.app_id, req.query.index_id).then((fileInfo) => {
      res.json(fileInfo);
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