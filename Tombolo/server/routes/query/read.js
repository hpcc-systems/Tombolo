const express = require('express');
const router = express.Router();
var models  = require('../../models');
let Query = models.query;
let QueryField = models.query_field;
let AssetsGroups = models.assets_groups;
let Dataflow = models.dataflow;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const assetUtil = require('../../utils/assets');

let updateQueryDetails = (queryId, applicationId, req) => {
  let fieldsToUpdate = {"query_id":queryId, "application_id":applicationId};
  var queryFieldToSave = updateCommonData(req.body.query.fields, fieldsToUpdate);
  return new Promise(async (resolve, reject) => {
    QueryField.destroy({where: {"query_id":queryId, "application_id":applicationId}}).then((deletedResult) => {
      QueryField.bulkCreate(
          queryFieldToSave, {updateOnDuplicate: ["field_type", "name", "type"]}
      ).then((result) => {
        resolve({"result":"success", "title":req.body.query.basic.title, "queryId":queryId});
      }).catch((err) => {
        reject(err)
      })
    }).catch((err) => {
      reject(err)
    })
  })
}

router.post('/saveQuery', [
  body('id')
  .optional({checkFalsy:true})
    .isUUID(4).withMessage('Invalid id'),
  body('query.basic.application_id')
    .isUUID(4).withMessage('Invalid application id'),
  body('query.basic.name')
  .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid name')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  var query_id, fieldsToUpdate={}, applicationId=req.body.query.basic.application_id;
  try {
    Query.findOne({where: {name: req.body.query.basic.name, application_id: applicationId}}).then(async (existingQuery) => {
      let query = null;
      if(!existingQuery) {
        query = await Query.create(req.body.query.basic);
      } else {
        query = await Query.update(req.body.query.basic, {where:{application_id: applicationId, id:req.body.id}}).then((updatedQuery) => {
          return updatedQuery;
        })
      }
      let queryId = query.id ? query.id : req.body.id;
      if(req.body.query.basic && req.body.query.basic.groupId) {
        let assetsGroupsCreated = AssetsGroups.findOrCreate({
          where: {assetId: queryId, groupId: req.body.query.basic.groupId},
          defaults:{
            assetId: queryId,
            groupId: req.body.query.basic.groupId
          }
        })
      }
      updateQueryDetails(queryId, applicationId, req).then((response) => {
        res.json(response);
      })
    })
  } catch(err) {
    console.log(err);
    return res.status(500).send("Error occured while saving Query");
  }
});

router.get('/query_list', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
      Query.findAll({where:{"application_id":req.query.app_id}, order: [['createdAt', 'DESC']]}).then(function(queries) {
          res.json(queries);
      })
      .catch(function(err) {
          console.log(err);
      });
  } catch (err) {
      console.log('err', err);
  }
});


router.get('/query_details', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('query_id')
    .isUUID(4).withMessage('Invalid query id'),
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    Query.findOne({where:{"application_id":req.query.app_id, "id":req.query.query_id}, include: [QueryField]}).then(function(query) {
        res.json(query);
    })
    .catch(function(err) {
        console.log(err);
    });
  } catch (err) {
    console.log('err', err);
  }
});

router.post('/delete', [
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
  body('queryId')
    .isUUID(4).withMessage('Invalid query id'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
      Query.destroy(
          {where:{"id": req.body.queryId, "application_id":req.body.application_id}}
      ).then(function(deleted) {
          QueryField.destroy(
              {where:{ query_id: req.body.queryId }}
          ).then(function(layoutDeleted) {
              res.json({"result":"success"});
          });
      }).catch(function(err) {
          console.log(err);
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