const express = require('express');
const router = express.Router();
const assert = require('assert');[]
var models  = require('../../models');
let UserApplication = models.user_application;
let Application = models.application;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const NotificationModule = require('../notifications/email-notification');
const authServiceUtil = require('../../utils/auth-service-utils');
let Sequelize = require('sequelize');
const Op = Sequelize.Op;

router.get('/app_list', (req, res) => {
  console.log("[app/read.js] - App route called");

  try {
    models.application.findAll({order: [['updatedAt', 'DESC']]}).then(function(applications) {
        res.json(applications);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while getting application list" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while getting application list" });
  }
});
router.get('/appListByUserId', (req, res) => {
  console.log("[app/read.js] -  Get app list for user id ="+ req.query.user_id);

  try {
    models.application.findAll({where:{
      [Op.or]: [
        {"$user_id$":req.query.user_id},
        {"$user_id$": req.query.user_name}
      ]
    }, order: [['updatedAt', 'DESC']],
    include: [UserApplication]
        }).then(function(applications) {
        res.json(applications);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while getting application list" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while getting application list" });
  }
});

router.get('/app', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[app/read.js] - App route called: "+req.query.app_id);

  try {
    models.application.findOne({
        where: {"id":req.query.app_id}
    }).then(function(application) {
        res.json(application);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while getting application details" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while getting application details" });
  }
});

router.post('/newapp', [
  body('user_id')
    .optional({checkFalsy:true})
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid user_id'),
  body('title')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid title'),
  body('description')
    .optional({checkFalsy:true}),
  body('creator')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid creator'),
],function (req, res) {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    if(req.body.id == '') {
      models.application.create({"title":req.body.title, "description":req.body.description, "creator": req.body.creator}).then(function(application) {
        if(req.body.user_id)
          models.user_application.create({"user_id":req.body.user_id, "application_id":application.id}).then(function(userapp) {
          res.json({"result":"success", "id": application.id});
        });
      else
          res.json({"result":"success", "id": application.id});
      });
    } else {
      models.application.update(req.body, {where:{id:req.body.id}}).then(function(result){
          res.json({"result":"success", "id": result.id});
      })
    }
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while creating application" });
  }
});

router.post('/removeapp', function (req, res) {
  try {
      models.application.destroy({
          where:{id: req.body.appIdsToDelete}
      }).then(function(deleted) {
          return res.status(200).send({"result":"success"});
      });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while removing application" });
  }
});

router.post('/saveUserApp', function (req, res) {
  console.log("[app/read.js] - saveUserApp called");
  var userAppList=req.body.users;
  try {
    UserApplication.bulkCreate(userAppList).then(async function(application) {
      let userDetail = await authServiceUtil.getUserDetails(req, userAppList[0].user_id);
      Application.findOne({where: {id:userAppList[0].application_id}}).then((application) => {
        NotificationModule.notifyApplicationShare(userDetail[0].email, application.title, req);
      })
      res.json({"result":"success"});
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while saving user application mapping" });
  }
});

//Import application
router.post('/importApp', [
  body('user_id')
    .optional({checkFalsy:true})
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid user_id'),
  body('title')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid title'),
  body('description')
    .optional({checkFalsy:true}),
  body('creator')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid creator'),
],function (req, res) {
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< creating app", req.body)
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    if(req.body.id == '') {
      models.application.create({"title":req.body.title, "description":req.body.description, "creator": req.body.creator}).then(function(application) {
        if(req.body.user_id)
          models.user_application.create({"user_id":req.body.user_id, "application_id":application.id}).then(function(userapp) {
          res.json({"result":"success", "id": application.id});
        });
      else
          res.json({"result":"success", "id": application.id});
      });
    } else {
      models.application.update(req.body, {where:{id:req.body.id}}).then(function(result){
          res.json({"result":"success", "id": result.id});
      })
    }
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while creating application" });
  }
});


module.exports = router;