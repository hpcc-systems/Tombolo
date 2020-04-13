const express = require('express');
const router = express.Router();
const assert = require('assert');[]
var models  = require('../../models');
let UserApplication = models.user_application;

router.get('/app_list', (req, res) => {
    console.log("[app/read.js] - App route called");

    try {
        models.application.findAll().then(function(applications) {
            res.json(applications);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});
router.get('/appListByUserId', (req, res) => {
    console.log("[app/read.js] -  Get app list for user id ="+ req.query.user_id);

    try {
        models.application.findAll({where:{"$user_id$":req.query.user_id}, include: [UserApplication]}).then(function(applications) {
            res.json(applications);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/app', (req, res) => {
    console.log("[app/read.js] - App route called: "+req.query.app_id);

    try {
        models.application.findOne({
            where: {"id":req.query.app_id}
        }).then(function(application) {
            res.json(application);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.post('/newapp', function (req, res) {
    try {
        if(req.body.id == '') {
            models.application.create({"title":req.body.title, "description":req.body.description}).then(function(applciation) {
                if(req.body.user_id)
                models.user_application.create({"user_id":req.body.user_id, "application_id":applciation.id}).then(function(userapp) {
                res.json({"result":"success"});
                });
            else
                res.json({"result":"success"});
            });
        } else {
            models.application.update(req.body, {where:{id:req.body.id}}).then(function(result){
                res.json({"result":"success"});
            })
        }
    } catch (err) {
        console.log('err', err);
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
    }
});



router.post('/saveUserApp', function (req, res) {
    console.log("[app/read.js] - saveUserApp called");
    var userAppList=req.body.users;
    try {
        UserApplication.bulkCreate(userAppList).then(function(application) {
            res.json({"result":"success"});
        });
    } catch (err) {
        console.log('err', err);
    }
});
module.exports = router;