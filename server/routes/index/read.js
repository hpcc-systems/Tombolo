const express = require('express');
const router = express.Router();
const assert = require('assert');
var models  = require('../../models');
let Index = models.indexes;
let IndexKey = models.index_key;
let IndexPayload = models.index_payload;
let File=models.file;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator/check');

router.get('/index_list', [  
  query('app_id')
    .isUUID(4).withMessage('Invalid app id')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log("[index/read.js] - Get file list for app_id = " + req.query.app_id);
    Index.findAll({where:{"application_id":req.query.app_id},include: [File], order: [['createdAt', 'DESC']]}).then(function(indexes) {
        res.json(indexes);
    })
    .catch(function(err) {
        console.log(err);
    });
});

router.post('/saveIndex', [  
  body('index.basic._id')
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
    console.log("[saveIndex/read.js] - Get file list for app_id = " + req.body.index.basic._id);
    var index_id, fieldsToUpdate={}, applicationId=req.body.index.basic.application_id;
    try {
        Index.findOrCreate(
            {where: {application_id:applicationId, title:req.body.index.basic.title},
            defaults: req.body.index.basic
        }).then(function(result) {
            index_id = result[0].id;
            fieldsToUpdate = {"index_id":index_id, "application_id":applicationId};
            if(!result[1]) {
                Index.update(req.body.index.basic, {where:{application_id:applicationId, title:req.body.index.basic.title}}).then(function(result){})
            }
            var indexKeyToSave = updateCommonData(req.body.index.indexKey, fieldsToUpdate);
            IndexKey.destroy({where:{application_id:applicationId, "index_id":index_id}}).then((deleted) => {
                return IndexKey.bulkCreate(
                    indexKeyToSave
                )
            })
        }).then(function(indexKey) {
            console.log("saving index payload");
            var indexPayloadToSave = updateCommonData(req.body.index.indexPayload, fieldsToUpdate);
            IndexPayload.destroy({where:{application_id:applicationId, "index_id":index_id}}).then((deleted) => {
                return IndexPayload.bulkCreate(
                    indexPayloadToSave
                )
            })
        }).then((indexPayLoadUpdated) => {
            console.log('index_id: '+index_id)
            res.json({"result":"success", "title":req.body.index.basic.title, "indexId":index_id});
        }).catch((err) => {
          console.log('Index Save Error:' +err)
            return res.status(500).send("Error occured while saving index");
        })

    } catch (err) {
        console.log('err', err);
    }

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
        Index.findOne({where:{"application_id":req.query.app_id, "id":req.query.index_id}, include: [IndexKey, IndexPayload]}).then(function(indexes) {
            results.basic = indexes;
            res.json(results);
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