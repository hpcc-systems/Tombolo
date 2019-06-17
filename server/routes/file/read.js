const express = require('express');
const router = express.Router();
const dbUtil = require('../../utils/db');
const lodash = require('lodash');
var models  = require('../../models');
let File = models.file;
let FileLayout = models.file_layout;
let FileLicense = models.file_license;
let FileRelation = models.file_relation;
let FileFieldRelation = models.file_field_relation;
let FileValidation = models.file_validation;
let License = models.license;
TreeConnection = models.tree_connection;
TreeStyle = models.tree_style;
let Sequelize = require('sequelize');
const Op = Sequelize.Op;

//let FileTree = require('../../models/File_Tree');
const fileService = require('./fileservice');

router.get('/file_list', (req, res) => {
    console.log("[file list/read.js] - Get file list for app_id = " + req.query.app_id);
    try {
        File.findAll({where:{"application_id":req.query.app_id}}).then(function(files) {
            res.json(files);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/licenses', (req, res) => {
    try {
        License.findAll().then(function(licenses) {
            res.json(licenses);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/file_ids', (req, res) => {
    console.log("[ffile_ids/read.js] - Get file list for app_id = " + req.query.app_id);
    var results = [];
    try {
        File.findAll({where:{"application_id":req.query.app_id}}).then(function(fileIds) {
            fileIds.forEach(function(doc, idx) {
                var fileObj = {};
                fileObj.id = doc.id;
                fileObj.title = doc.title;
                results.push(fileObj);
            });
            res.json(results);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }

});

router.get('/file_details', (req, res) => {
    console.log("[file_details/read.js] - Get file details for app_id = " + req.query.app_id + " and file_id "+req.query.file_id);
    var basic = {}, results={};
    try {
        File.findOne({where:{"application_id":req.query.app_id, "id":req.query.file_id}}).then(function(files) {
            results.basic = files;
            FileLayout.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileLayouts) {
                results.file_layouts = fileLayouts;
                FileLicense.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileLicenses) {
                    results.file_licenses = fileLicenses;
                    FileRelation.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileRelations) {
                        results.file_relations = fileRelations;
                        FileValidation.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileValidations) {
                            results.file_validations = fileValidations;
                            FileFieldRelation.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileFieldRelations) {
                                results.file_field_relations = fileFieldRelations;
                                res.json(results);
                            });
                        });
                    });
                });
            });
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }

});

router.post('/saveFile', (req, res) => {
    console.log("[file list/read.js] - Get file list for app_id = " + req.body.file.basic._id + " isNewFile: "+req.body.isNewFile);
    var fileId='', applicationId=req.body.file.basic.application_id, fieldsToUpdate={};

    try {
        File.findOrCreate({
            where:{application_id:applicationId, title:req.body.file.basic.title},
            defaults:req.body.file.basic
        }).then(function(result) {
            fileId = result[0].id;
            fieldsToUpdate = {"file_id"  : fileId, "application_id" : applicationId};
            //if file record already exists, then update it
            if(!result[1]) {
                File.update(req.body.file.basic, {where:{application_id:applicationId, title:req.body.file.basic.title}}).then(function(result){})
            }
            var fileLayoutToSave = updateCommonData(req.body.file.layout, fieldsToUpdate);
            return FileLayout.bulkCreate(
                fileLayoutToSave, {updateOnDuplicate: ["name", "type", "displayType", "displaySize", "textJustification", "format", "isSPII", "isPII"]}
            )
        }).then(function(fileLayout) {
            var fileLicensToSave = updateCommonData(req.body.file.license, fieldsToUpdate);
            return FileLicense.bulkCreate(
                fileLicensToSave,
                {updateOnDuplicate: ["name", "url"]}
            )
        }).then(function(fileLicense) {
            var fileRelationToSave = updateCommonData(req.body.file.relation, fieldsToUpdate);
            return FileRelation.bulkCreate(
                fileRelationToSave,
                {updateOnDuplicate: ["source_file_id"]}
            )
        }).then(function(fileRelation) {
            console.log('fieldsToUpdate:' +JSON.stringify(fieldsToUpdate));
            var fileFieldRelationToSave = updateCommonData(req.body.file.fileFieldRelation, fieldsToUpdate);
            console.log('fileFieldRelationToSave: '+JSON.stringify(fileFieldRelationToSave));
            return FileFieldRelation.bulkCreate(
                fileFieldRelationToSave,
                {updateOnDuplicate: ["field", "source_field", "requirements"]}
            )
        }).then(function(fileFieldRelation) {
            var fileValidationsToSave = updateCommonData(req.body.file.validation, fieldsToUpdate);
            return FileValidation.bulkCreate(
                fileValidationsToSave,
                {updateOnDuplicate: ["name", "ruleType", "rule", "action", "fixScript"]}
            )
        }).then(function(fieldValidation) {
            res.json({"result":"success"});
        }), function(err) {
            return res.status(500).send(err);
        }
    } catch (err) {
        console.log('err', err);
    }
});

router.post('/delete', (req, res) => {
    let updatedSources = [];
    console.log("[file delete] - Get file list for fileId = " + req.body.fileId + " appId: "+req.body.application_id);
    File.destroy(
        {where:{id: req.body.fileId, application_id: req.body.application_id}}
    ).then(function(deleted) {
        FileLayout.destroy(
            {where:{ file_id: req.body.fileId }}
        ).then(function(layoutDeleted) {
            FileLicense.destroy(
                {where:{file_id: req.body.fileId}}
            ).then(function(licenseDeleted) {
                FileRelation.destroy(
                    {where:{file_id: req.body.fileId}}
                ).then(function(relationDeleted) {
                    FileFieldRelation.destroy(
                        {where:{file_id: req.body.fileId}}
                    ).then(function(fieldRelationDeleted) {
                        FileValidation.destroy(
                            {where:{file_id: req.body.fileId}}
                        ).then(function(validationDeleted) {
                            TreeConnection.destroy(
                                {where:{ [Op.or]: [{sourceid: req.body.fileId}, {targetid: req.body.fileId}]}}
                            ).then(function(connectionDeleted) {
                                TreeStyle.destroy(
                                    {where:{node_id: req.body.fileId}}
                                ).then(function(styleDeleted) {
                                    res.json({"result":"success"});
                                });
                            })
                        })
                    })
                })
            })
        })

    })
});

router.get('/file_fields', (req, res) => {
    console.log("[file list/read.js] - Get fields in files app_id = " + req.query.file_ids);
    var results = [];

    try {
        FileLayout.findAll({where: {"file_id":{[Op.in]:req.query.file_ids.split(",")}}}).then(function(fileLayout) {
            fileLayout.forEach(function(doc, idx) {
                results.push(doc.file_id+"."+doc.name);
            });

            res.json(results);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/isSourceFile', (req, res) => {
    console.log("[isSourceFile/read.js] - check if file is already a source app_id = " +req.query.app_id + "file_id: "+ req.query.file_id);
    var results = false;

    try {
        FileRelation.findAll({where:{"application_id":req.query.app_id, "source_file_id":req.query.file_id}}).then(function(file) {
            if(file != undefined && file.length > 0) {
                results = true;
            }
            res.json(results);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/downloadSchema', (req, res) => {
    console.log("[downloadSchema/read.js] - downloadSchema app_id = " + req.query.app_id + " - type: "+req.query.type);
    if(req.query.type == 'ecl') {
        fileService.getECLSchema(req.query.app_id, res)
    } else if (req.query.type == 'json') {
        fileService.getJSONSchema(req.query.app_id, res)
    }

});

router.post('/saveFileTree', (req, res) => {
    let updatedSources = [], connectionId='';
    console.log("[file saveFileTree] - Save File Tree appId: "+req.body.application_id);
    try {
        var connections = req.body.connections, applicationId=req.body.application_id;
        TreeConnection.destroy({where:{"application_id": req.body.application_id}}).then(function(destroyed) {
            connections.forEach(function(connection, index) {
                TreeConnection.findOrCreate({
                    where:{application_id:applicationId, sourceid:connection.sourceid, targetid:connection.targetid},
                    defaults:{
                        "application_id": req.body.application_id,
                        "sourceid": connection.sourceid,
                        "targetid": connection.targetid,
                        "sourceEndPointType": connection.sourceEndPointType,
                        "targetEndPointType": connection.targetEndPointType
                    }
                }), function(err) {
                    return res.status(500).send(err);
                }
            });
        });

        var stylesToSave = updateCommonData(req.body.styles, {"application_id":applicationId});
        TreeStyle.bulkCreate(
            stylesToSave,
            {updateOnDuplicate: ["style", "node_id"]}
        ).then(function(query) {
            console.log("saving styles");
            res.json({"result":"success"});
        }), function(err) {
            return res.status(500).send(err);
        }
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/filetree', (req, res) => {
    console.log("[filetree/read.js] - get file tree for app_id = " +req.query.app_id);
    var results = false;

    try {
        var result = {}
        TreeConnection.findAll({where: {"application_id":req.query.app_id}}, {attributes: ['sourceid', 'targetid', 'sourceEndPointType', 'targetEndPointType']}).then(function(fileTree) {
            TreeStyle.findAll({where: {"application_id":req.query.app_id}}, {attributes: ['node_id', 'style']}).then(function(style) {
                result.connections = fileTree;
                result.tree_styles = style;
                res.json(result);
            });
        })
        .catch(function(err) {
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