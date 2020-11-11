const express = require('express');
const router = express.Router();
const dbUtil = require('../../utils/db');
const lodash = require('lodash');
var models  = require('../../models');
const hpccUtil = require('../../utils/hpcc-util');
let Application = models.application;
let UserApplication = models.user_application;
let File = models.file;
let FileLayout = models.file_layout;
let FileLicense = models.file_license;
let FileRelation = models.file_relation;
let FileFieldRelation = models.file_field_relation;
let FileValidation = models.file_validation;
let License = models.license;
let Dataflow = models.dataflow;
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
const validatorUtil = require('../../utils/validator');
const { body, query, check, validationResult } = require('express-validator/check');

//let FileTree = require('../../models/File_Tree');
const fileService = require('./fileservice');

router.get('/file_list', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log("[file list/read.js] - Get file list for app_id = " + req.query.app_id);
    try {
        File.findAll({where:{"application_id":req.query.app_id}, include: [Dataflow], order: [['createdAt', 'DESC']]}).then(function(files) {
            res.json(files);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.post('/all', [
  query('keyword')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid keyword'),
  query('userId')
    .isInt().withMessage('Invalid userid'),
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log("[file list/read.js] - Get all file defns");
    try {
        Application.findAll({ 
          attributes: ['id'], 
          raw:true, 
          include: [UserApplication],
          where:{"$user_id$":req.query.userId}
        }).then(function(applications) {
          let appIds = applications.map(app => app.id); 
          File.findAll({where: {"application_id":{[Op.in]:appIds}, "title":{[Op.like]: "%" + req.query.keyword + "%"}}, attributes: ['id', 'title', 'name', 'application_id'], raw:true}).then(fileDefns => {
            console.log(fileDefns);
            let fileDefSuggestions = fileDefns.map(fileDefn => {

              return {"text": fileDefn.title, "value":fileDefn.title, "id":fileDefn.id, "name":fileDefn.name, "app_id":fileDefn.application_id}
            })
            res.json(fileDefSuggestions);
          })
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

router.get('/CheckFileId', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('file_id')
    .isUUID(4).withMessage('Invalid file id'),
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
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

router.get('/file_ids', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),  
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
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

router.get('/file_details', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('file_id')
    .isUUID(4).withMessage('Invalid fileId'),
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
    console.log("[file_details/read.js] - Get file details for app_id = " + req.query.app_id + " and file_id "+req.query.file_id);
    var basic = {}, results={};
    try {
        File.findOne({where:{"application_id":req.query.app_id, "id":req.query.file_id}}).then(function(files) {
            results.basic = files;
            FileLayout.findAll({where:{"application_id":req.query.app_id, "file_id":req.query.file_id}}).then(function(fileLayout) {
              let fileLayoutObj = (fileLayout.length == 1 && fileLayout[0].fields) ? JSON.parse(fileLayout[0].fields) : fileLayout;
              console.log(fileLayoutObj)
              results.file_layouts = fileLayoutObj.filter(item => item.name != '__fileposition__');
              console.log('layouts**********'+JSON.stringify(results.file_layouts))
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

let updateFileDetails = (fileId, applicationId, req) => {
  let fieldsToUpdate = {"file_id"  : fileId, "application_id" : applicationId}; 
  return new Promise((resolve, reject) => {
    FileLayout.findOrCreate({
      where:{application_id:applicationId, file_id: fileId},
      defaults:{
        application_id: applicationId,
        file_id: fileId,
        fields: JSON.stringify(req.body.file.fields)
      }
    }).then(function(result) {
      let fileLayoutId = result[0].id;
      if(!result[1]) {
        return FileLayout.update({fields:JSON.stringify(req.body.file.fields)}, {where: {application_id:applicationId, file_id: fileId}});
      }
    }).then(function(fileLayout) {
      FileLicense.destroy(
          {where:{file_id: fileId}}
      ).then(function(deleted) {
      var fileLicensToSave = hpccUtil.updateCommonData(req.body.file.license, fieldsToUpdate);
      return FileLicense.bulkCreate(
          fileLicensToSave,
          {updateOnDuplicate: ["name", "url"]}
      )  })
    }).then(function(fileLicense) {
      var fileRelationToSave = hpccUtil.updateCommonData(req.body.file.relation, fieldsToUpdate);
      return FileRelation.bulkCreate(
          fileRelationToSave,
          {updateOnDuplicate: ["source_file_id"]}
      )
    }).then(function(fileRelation) {
      console.log('fieldsToUpdate:' +JSON.stringify(fieldsToUpdate));
      var fileFieldRelationToSave = hpccUtil.updateCommonData(req.body.file.fileFieldRelation, fieldsToUpdate);
      console.log('fileFieldRelationToSave: '+JSON.stringify(fileFieldRelationToSave));
      return FileFieldRelation.bulkCreate(
          fileFieldRelationToSave,
          {updateOnDuplicate: ["field", "source_field", "requirements"]}
      )
    }).then(function(fileFieldRelation) {
      var fileValidationsToSave = hpccUtil.updateCommonData(req.body.file.validation, fieldsToUpdate);
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
      resolve({"result":"success", "fileId":fileId, "title":req.body.file.basic.title})              
    }), function(err) {
      reject(err)
      //return res.status(500).send(err);
    }
  })
}

router.post('/saveFile', (req, res) => {
    console.log("[file list/read.js] - Get file list for app_id = " + req.body.file.app_id + " isNewFile: "+req.body.isNew);
    var fileId='', applicationId=req.body.file.app_id, fieldsToUpdate={};

    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
      
      if(req.body.isNew) {
        File.create(
          req.body.file.basic
        ).then((result) => {
          updateFileDetails(result.id, applicationId, req).then((response) => {
            res.json(response);
          })
        })
      } else {
        File.update(
          req.body.file.basic, {where:{application_id: applicationId, id:req.body.id}}
        ).then((result) => {
          updateFileDetails(req.body.id, applicationId, req).then((response) => {
            res.json(response);
          })
        })
      }      
    } catch (err) {
      console.log('err', err);
    }
});

router.post('/delete', [
  body('fileId')
    .isUUID(4).withMessage('Invalid file id'),
  body('application_id')
    .isUUID(4).withMessage('Invalid application id'),
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
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

router.get('/isSourceFile', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('file_id')
    .isUUID(4).withMessage('Invalid file id'),
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
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

router.get('/downloadSchema', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('type')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid script type')    
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[downloadSchema/read.js] - downloadSchema app_id = " + req.query.app_id + " - type: "+req.query.type);
  if(req.query.type == 'ecl') {
      fileService.getECLSchema(req.query.app_id, res)
  } else if (req.query.type == 'json') {
      fileService.getJSONSchema(req.query.app_id, res)
  }

});

router.get('/inheritedLicenses', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('fileId')
    .isUUID(4).withMessage('Invalid file id'),
  query('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id'),  
], async function (req, res) {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  let results = [];
  try {
    var parentIds = await getFileRelationHierarchy(req.query.app_id, req.query.fileId, req.query.id, req.query.dataflowId);

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

router.get('/fileLicenseCount', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),  
  ], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
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

router.get('/DependenciesCount', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),  
  ], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
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

router.get('/fileLayoutDataType', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),  
  ], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
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

router.get('/getFileLayoutByDataType', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),  
  query('data_type')
    .isUUID(4).withMessage('Invalid data type'),   
  ], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
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

router.get('/LicenseFileList', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),  
  query('name')
    .isUUID(4).withMessage('Invalid name'),   
  ], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
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
          //results.push("");
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

async function getFileRelationHierarchy(applicationId, fileId, id, dataflowId) {
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

    return DataflowGraph.findOne({where:{"application_Id":applicationId, "dataflowId":dataflowId}}).then((graph) => {
      let fileNodes = JSON.parse(graph.nodes).filter(node => node.fileId==fileId);
      if(id == 'undefined') {
        id = fileNodes[0].id;
      }
      const tree = makeTree (JSON.parse(graph.nodes), JSON.parse(graph.edges));
      const parentIds = getFlat(tree);
      return parentIds;
    })
    .catch(function(err) {
        console.log(err);
    });
}

router.get('/filelayout', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),  
  query('name')
    .isUUID(4).withMessage('Invalid name'),   
  ], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log("[file_details/read.js] - Get file details for app_id = " + req.query.app_id + " and file_name "+req.query.name);
    var basic = {}, results={};
    try {
      File.findAll({where:
        {"application_id":req.query.app_id, 
        [Op.or]: [
        {
          "name": {
            [Op.eq]: req.query.name
          }
        },
        {
          "scope": {
            [Op.eq]: req.query.name
          }
        }
      ]}, include:[FileLayout, FileValidation]}).then(function(files) {        
        if(files[0].file_layouts) {
          files[0].file_layouts.forEach((layout) => {
            let validationRule = files[0].file_validations.filter((validation => validation.name == layout.name));
            
            results[layout.name] = {
              "type": layout.type,
              "eclType": layout.eclType,
              "validation_rules": validationRule[0].ruleType
            }
          })
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



module.exports = router;