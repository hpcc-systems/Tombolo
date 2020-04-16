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
let Rules = models.rules;
let DataTypes=models.data_types;
TreeConnection = models.tree_connection;
TreeStyle = models.tree_style;
let ConsumerObject = models.consumer_object;
let DataflowGraph = models.dataflowgraph;
let Sequelize = require('sequelize');
const Op = Sequelize.Op;
let Indexes=models.indexes;
let Query=models.query;
let Job=models.job;

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

router.get('/rules', (req, res) => {
    try {
        Rules.findAll().then(function(rules) {
            res.json(rules);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/CheckFileId', (req, res) => {
    console.log("[CheckFileId/read.js] - check file by app_id = " + req.query.app_id +" and file_id ="+ req.query.file_id);
    try {
        File.findOne({
            where: {"application_id":req.query.app_id,"id":req.query.file_id}
        }).then(function(file) {
            if(file)
            res.json(true);
            else
            res.json(false);
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
                fileObj.name = doc.name;
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
                results.file_layouts = fileLayouts.filter(item => item.name != '__fileposition__');
                FileLicense.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileLicenses) {
                    results.file_licenses = fileLicenses;
                    FileRelation.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileRelations) {
                        results.file_relations = fileRelations;
                        FileValidation.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileValidations) {
                            results.file_validations = fileValidations.filter(item => item.name != '__fileposition__');
                            FileFieldRelation.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileFieldRelations) {
                                results.file_field_relations = fileFieldRelations;
                            }).then(function(fileFieldRelation) {
                                ConsumerObject.findAll({where:{"object_id":req.query.file_id, "object_type":"file"}}).then(function(fileConsumers) {
                                    results.consumers = fileConsumers;
                                    res.json(results);
                                });
                            });
                        });
                    });
                });
            })
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }

});

router.post('/saveFile', (req, res) => {
    console.log("[file list/read.js] - Get file list for app_id = " + req.body.file.app_id + " isNewFile: "+req.body.isNewFile);
    var fileId='', applicationId=req.body.file.app_id, fieldsToUpdate={};

    try {
        File.findOrCreate({
            where:{application_id:applicationId, name:req.body.file.basic.name},
            defaults:req.body.file.basic
        }).then(function(result) {
            fileId = result[0].id;
            fieldsToUpdate = {"file_id"  : fileId, "application_id" : applicationId};
            //if file record already exists, then update it
            if(!result[1]) {
                File.update(req.body.file.basic, {where:{application_id:applicationId, name:req.body.file.basic.name}}).then(function(result){})
            }
            var fileLayoutToSave = updateCommonData(req.body.file.layout, fieldsToUpdate);
            return FileLayout.bulkCreate(
                fileLayoutToSave, {updateOnDuplicate: ["name", "type", "displayType", "displaySize", "textJustification", "format","data_types", "isPCI", "isPII", "isHIPAA", "description", "required"]}
            )
        }).then(function(fileLayout) {
            FileLicense.destroy(
                {where:{file_id: fileId}}
            ).then(function(deleted) {
            var fileLicensToSave = updateCommonData(req.body.file.license, fieldsToUpdate);
            return FileLicense.bulkCreate(
                fileLicensToSave,
                {updateOnDuplicate: ["name", "url"]}
            )  })
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
        }).then(function(fileFieldValidation) {
            if(req.body.file.consumer) {
                return ConsumerObject.bulkCreate(
                {
                    "consumer_id" : req.body.file.consumer.id,
                    "object_id" : fileId,
                    "object_type" : "file"
                }
                )
            }
        }).then(function(fieldValidation) {
            res.json({"result":"success", "fileId":fileId, "title":req.body.file.basic.title});
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
                                    ConsumerObject.destroy(
                                        {where:{object_id: req.body.fileId, object_type: "file"}}
                                    ).then(function(consumerDeleted) {
                                        res.json({"result":"success"});
                                    });
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


router.get('/inheritedLicenses', async function (req, res) {
    let results = [];
    try {
        var parentIds = await getFileRelationHierarchy(req.query.app_id, req.query.fileId, req.query.id);

        File.findAll(
        {
            where:{"id": {[Op.in]:parentIds}},
            attributes:["id", "title", "name"]
        }
        ).then(async function(files) {
          let licenses = new Set();
          for(const file of files) {
            var fileLicenses = await FileLicense.findAll({where:{"file_id":file.id}});
            fileLicenses.forEach(function (fileLicense) {
                licenses.add(fileLicense.name)
            });
          }
          res.json(Array.from(licenses));
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/fileLicenseCount', (req, res) => {
    console.log("[fileLicenseCount/read.js] - get file license count for app_id = " +req.query.app_id);
    try {
        var result = {};
        FileLicense.findAll({
            where:{"application_id":req.query.app_id},
            group: ['name'],
            attributes: ['name', [Sequelize.fn('COUNT', 'name'), 'fileCount']],
          }).then(function (licenseCount) {
              result.licenseFileCount=licenseCount;
              File.findAndCountAll({
                where:{
                    "application_id":req.query.app_id,
                    "id": {
                    [Op.notIn]: Sequelize.literal(
                        '( SELECT file_id ' +
                            'FROM file_license ' +
                           'WHERE application_id = "' + req.query.app_id +
                        '")')
                    }
                }
            }).then(function (file) {
                  result.nonLicensefileCount=file.count;
                  res.json(result);
            })
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/DependenciesCount', (req, res) => {
    console.log("[DependenciesCount/read.js] - get dependencies count for app_id = " +req.query.app_id);
    try {
        var result = {};
        File.findAndCountAll({
            where:{"application_id":req.query.app_id}
          }).then(function (file) {
              result.fileCount=file.count;
        Indexes.findAndCountAll({
            where:{"application_id":req.query.app_id}
          }).then(function (index) {
              result.indexCount=index.count;
              Query.findAndCountAll({
                where:{"application_id":req.query.app_id}
              }).then(function (query) {
                  result.queryCount=query.count;
                  Job.findAndCountAll({
                    where:{"application_id":req.query.app_id}
                  }).then(function (job) {
                      result.jobCount=job.count;
                      res.json(result);
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

router.get('/fileLayoutDataType', (req, res) => {
    console.log("[fileLayoutDataType/read.js] - get File Layout data types count for app_id = " +req.query.app_id);
    try {
        var result = [];
        FileLayout.findAll({
            where:{"application_id":req.query.app_id,
            "data_types": {
                [Op.ne]: null
               },
               "data_types": {
                [Op.ne]: ""
               }},
            attributes: [
              'data_types',
              [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['data_types']
          }).then(function(fileLayout) {
            result=fileLayout;
            FileLayout.findAll({
                where:{"application_id":req.query.app_id,
               [Op.or]:[{ "data_types": {[Op.eq]: null}},
                          {"data_types": {[Op.eq]: ""}}]}
              }).then(function(fileLayout) {
                  var layout={};
                  layout.data_types="Others";
                  layout.count=fileLayout.length;
                  result.push(layout);
                  res.json(result);
              })
          })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/getFileLayoutByDataType', (req, res) => {
    console.log("[fileLayoutDataType/read.js] - get File Layout for app_id = " +req.query.app_id +" and datatype ="+req.query.data_type);
    try {
        var result = {};
        if(req.query.data_types=="others"){
            FileLayout.findAll({
                where:{"application_id":req.query.app_id,
                [Op.or]:[{ "data_types": {[Op.eq]: null}},
                          {"data_types": {[Op.eq]: ""}}]}, include: [File]
              }).then(function(fileLayout) {
                  res.json(fileLayout)
              })
            .catch(function(err) {
                console.log(err);
            });
        }else{
        FileLayout.findAll({
            where:{"application_id":req.query.app_id,
            "data_types":req.query.data_types}, include: [File]
          }).then(function(fileLayout) {
              res.json(fileLayout)
          })
        .catch(function(err) {
            console.log(err);
        });
    }
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/LicenseFileList', (req, res) => {
    console.log("[LicenseFileList/read.js] - Get file list for app_id = " + req.query.app_id +" and License= "+req.query.name);
    try {
        if(req.query.name=="No License")
        {
            File.findAll(
                {where:{
                    "application_id":req.query.app_id,
                    "id": {
                    [Op.notIn]: Sequelize.literal(
                        '( SELECT file_id ' +
                            'FROM file_license ' +
                           'WHERE application_id = "' + req.query.app_id +
                        '")')
                    }
                }
            }).then(function(files) {
                res.json(files);
            })
            .catch(function(err) {
                console.log(err);
            });
        }
        else{
            File.findAll({where:{"$file_licenses.name$":req.query.name,"application_id":req.query.app_id},
            include: [FileLicense]}).then(function(files) {
                res.json(files);
            })
            .catch(function(err) {
                console.log(err);
            });
        }
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/dataTypes', (req, res) => {
    try {
        var results = [];
        DataTypes.findAll().then(function(data_types) {
            results.push("");
            data_types.forEach(function(doc, idx) {
                results.push(doc.name);
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

function updateCommonData(objArray, fields) {
    if(objArray.length>0){
    Object.keys(fields).forEach(function (key, index) {
        objArray.forEach(function(obj) {
            obj[key] = fields[key];
        });
    });
    }
    return objArray;
}

async function getFileRelationHierarchy(applicationId, fileId, id) {
    var fileIds = [], promises = [];
    //ref: https://stackoverflow.com/questions/49845748/convert-a-flat-json-file-to-tree-structure-in-javascript
    const MutableNode = (title, fileId, children = []) =>
      ({ title, fileId, children })
      
    MutableNode.push = (node, child) =>
      (node.children.push (child), node)

    const makeTree = (nodes = [], relations = []) =>
        relations.reduce
        ( (t, l) =>
            t.set ( l.target
                  , MutableNode.push ( t.get (l.target)
                                     , t.get (l.source)
                                     )
                  )
        , nodes.reduce
            ( (t, n) => t.set (n.id, MutableNode (n.title, n.fileId))
            , new Map
            )
        )
        .get (parseInt(id))

    
    const getFlat = ({ fileId, children = [] }) => {
      return [fileId].concat(...children.map(getFlat));
    }        

    return DataflowGraph.findOne({where:{"application_Id":applicationId}}).then((graph) => {
      const tree = makeTree (JSON.parse(graph.nodes), JSON.parse(graph.edges));
      const parentIds = getFlat(tree);
      return parentIds;
    })
    .catch(function(err) {
        console.log(err);
    });
}

router.get('/filelayout', (req, res) => {
    console.log("[file_details/read.js] - Get file details for app_id = " + req.query.app_id + " and file_name "+req.query.name);
    var basic = {}, results={};
    try {
      File.findAll({where:{"application_id":req.query.app_id, "name":req.query.name}, include:[FileLayout, FileValidation]}).then(function(files) {        
        files[0].file_layouts.forEach((layout) => {
          let validationRule = files[0].file_validations.filter((validation => validation.name == layout.name));
          
          results[layout.name] = {
            "type": layout.type,
            "eclType": layout.eclType,
            "validation_rules": validationRule[0].ruleType
          }
        })
        res.json(results);
      })
      .catch(function(err) {
          console.log(err);
      });
    } catch (err) {
        console.log('err', err);
    }

});



module.exports = router;