const express = require('express');
const router = express.Router();
const lodash = require('lodash');
var models  = require('../../models');
const hpccUtil = require('../../utils/hpcc-util');
const assetUtil = require('../../utils/assets');
let Application = models.application;
let UserApplication = models.user_application;
let File = models.file;
let FileLayout = models.file_layout;
let FileLicense = models.file_license;
let FileValidation = models.file_validation;
let License = models.license;
var Cluster = models.cluster;
let Rules = models.rules;
let DataTypes=models.data_types;
let AssetsGroups=models.assets_groups;
TreeConnection = models.tree_connection;
TreeStyle = models.tree_style;
let ConsumerObject = models.consumer_object;
let DataflowGraph = models.dataflowgraph;
let Sequelize = require('sequelize');
const Op = Sequelize.Op;
let Indexes=models.indexes;
let Query=models.query;
let Job=models.job;
const JobFile = models.jobfile;
let AssetDataflow = models.assets_dataflows;
let Visualization=models.visualizations;
var request = require('request');
var requestPromise = require('request-promise');
const validatorUtil = require('../../utils/validator');
const { body, query, check, validationResult } = require('express-validator');

//let FileTree = require('../../models/File_Tree');
const fileService = require('./fileservice');
const axios = require('axios');

router.post( '/superfile_meta',
  [body('superFileAssetId').isUUID(4).withMessage('Invalid asset id')],
  async (req, res, next) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const superFileAssetId = req.body.superFileAssetId;
      const file = await File.findOne({ where: { id: superFileAssetId } });

      if (!file || !file?.isSuperFile) throw new Error('Asset not found');

      const cluster = await hpccUtil.getCluster(file.cluster_id);
      const clusterAuth = hpccUtil.getClusterAuth(cluster);
      
      const payload = {
        SuperfileListRequest: {
          superfile: file.name,
        },
      };

      const url =  cluster.thor_host + ':' + cluster.thor_port + '/WsDfu/SuperfileList?ver_=1.57';
      const response = await axios.post(url, payload, { headers: clusterAuth });
      
      const subfiles = response.data?.SuperfileListResponse?.subfiles?.Item
      if (!subfiles) throw new Error("Failed to get subfiles")

      res.json(subfiles);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);


router.get('/file_list', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application id'),
  query('dataflowId')
    .isUUID(4).optional({nullable: true}).withMessage('Invalid dataflow id'),
  query('clusterId')
    .isUUID(4).optional({nullable: true}).withMessage('Invalid cluster id'),
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log("[file list/read.js] - Get file list for app_id = " + req.query.app_id);
    try {
      let dataflowId = req.query.dataflowId;
      let query;
      if(dataflowId){
        query = 'select f.id, f.name, f.title, f.description, f.isSuperFile, f.metaData, f.createdAt, f.application_id, f.deletedAt '+
        'from file f ' + 
        'where f.id not in (select asd.assetId from assets_dataflows asd where asd.dataflowId = (:dataflowId) and asd.deletedAt is null)' +
        'and f.application_id = (:applicationId) '+
        'and (f.cluster_id = (:clusterId) or f.cluster_id is null)'+
        'and f.deletedAt is null';
      }else{
         query = 'select f.id, f.name, f.title, f.description, f.isSuperFile, f.createdAt, f.application_id, f.deletedAt '+
        'from file f ' + 
        'where  f.application_id = (:applicationId) '+
        'and f.deletedAt is null';
      } 
      
      let replacements = { applicationId: req.query.app_id, dataflowId: dataflowId, clusterId: req.query.clusterId};
      let existingFile = models.sequelize.query(query, {
        type: models.sequelize.QueryTypes.SELECT,
        replacements: replacements
      }).then((files) => {
        res.json(files);
      })
      .catch(function(err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Error occurred while getting file list" });
      });
    } catch (err) {
      console.log('err', err);
      return res.status(500).json({ success: false, message: "Error occurred while getting file list" });
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
          return res.status(500).json({ success: false, message: "Error occured while getting files" });
        });
    } catch (err) {
      console.log('err', err);
      return res.status(500).json({ success: false, message: "Error occured while getting files" });
    }
});


router.get('/licenses', (req, res) => {
  try {
    License.findAll({attributes: ["id", "name", "url", "description"]}).then(function(licenses) {
      res.json(licenses);
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Error occured while getting licenses" });
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
      return res.status(500).json({ success: false, message: "Error occured while getting rules" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while getting rules" });
  }
});

router.get('/files/:fileId/validation-rules', (req, res, next) => {
  FileValidation.findAll({
    where: {
      file_id: req.params.fileId
    }
  }).then(rules => {
    return res.json(rules);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).json({
      'message': 'An error occurred'
    });
  });
});

router.get('/files/:fileId/validation-rules/validations', (req, res, next) => {
  FileValidation.findAll({
    where: {
      file_id: req.params.fileId
    }
  }).then(rules => {
    let validations = '';
    rules.forEach(rule => {
      if (rule.rule_test) {
        validations += rule.rule_name + ':' + rule.rule_test + ';';
      }
    });
    return res.json({
      ecl: validations
    });
  }).catch(err => {
    console.log('err', err);
    return res.status(500).json({
      'message': 'An error occurred'
    });
  });
});

router.get('/files/:fileId/validation-rules/fixes', (req, res, next) => {
  FileValidation.findAll({
    where: {
      file_id: req.params.fileId
    }
  }).then(rules => {
    let fixes = '';
    rules.forEach(rule => {
      if (rule.rule_fix) {
        fixes += rule.rule_name + ':' + rule.rule_fix + ';';
      }
    });
    return res.json({
      ecl: fixes
    });
  }).catch(err => {
    console.log('err', err);
    return res.status(500).json({
      'message': 'An error occurred'
    });
  });
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
        assetUtil.fileInfo(req.query.app_id, req.query.file_id).then((fileInfo) => {
          res.json(fileInfo);
        })
        .catch(function(err) {
          console.log(err);
          return res.status(500).json({ success: false, message: "Error occured while file details" });
        });
    } catch (err) {
        console.log('err', err);
        return res.status(500).json({ success: false, message: "Error occured while file details" });
    }

});

//Gets sub-files associated with a super file
router.get('/getSubFiles',[
  query('clusterId').isUUID(4).withMessage('Invalid cluster ID'),
  query('fileName').notEmpty().withMessage('Invalid file name')
],
 async(req, res) =>{
   const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try{
  const{ clusterId, fileName} = req.query;
  const DFUService = await hpccUtil.getDFUService(clusterId);
  const response = await DFUService.DFUInfo({ Name: fileName });
  if (!response.FileDetail) throw new Error('File details not found');
  
  res.send(response.FileDetail.subfiles.Item)
  }catch(error){
    console.log('---- error while fetching sub-files ---------');
    console.dir({error}, {depth: null})
    console.log('---------------------------------------------');
    res.status(404).json({success : false, message : 'Unable to fetch subfiles'})
  }
});

exports.updateFileDetails = (fileId, applicationId, req) => {
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
        console.log("updating layout: "+fileLayoutId);
        return FileLayout.update({fields:JSON.stringify(req.body.file.fields)}, {where: {id: fileLayoutId}});
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
    }).then(function(fileFieldRelation) {
      var fileValidationsToSave = hpccUtil.updateCommonData(req.body.file.validation, fieldsToUpdate);
      return FileValidation.bulkCreate(
          fileValidationsToSave,
          {updateOnDuplicate: ["rule_name", "rule_field", "rule_test", "rule_fix"]}
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
      resolve({"result":"success", "fileId":fileId, "title":req.body.file.basic.title, "name": req.body.file.basic.name})
    }), function(err) {
      reject(err)
    }
  })
}

router.post('/saveFile', [
    body('id')
    .optional({checkFalsy:true})
      .isUUID(4).withMessage('Invalid id'),
    body('file.basic.application_id')
      .isUUID(4).withMessage('Invalid application id'),
    body('file.basic.title')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid title')
  ], async (req, res) => {
    console.log("[file list/read.js] - Get file list for app_id = " + req.body.file.app_id + " isNewFile: "+req.body.isNew);
    var fileId='', applicationId=req.body.file.app_id, fieldsToUpdate={};

    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }

      const { removeAssetId = '', renameAssetId = '',  basic } = req.body.file;
      const { name, cluster_id, application_id } = basic;
      
      // We want to delete design file if it was associated with existing file that is already in Tombolo DB
      if (removeAssetId) {
        await Promise.all([
          JobFile.destroy({ where: { file_id: removeAssetId } }),
          FileLayout.destroy({ where: { file_id: removeAssetId } }),
          FileLicense.destroy({ where: { file_id: removeAssetId } }),
          AssetDataflow.destroy({ where: { assetId: removeAssetId } }),
          FileValidation.destroy({ where: { file_id: removeAssetId } }),
          File.destroy({ where: { id: removeAssetId, application_id } }),
        ]);
      }
      // We want to update design file if it was associated with HPCC file that was not in Tombolo DB
      if (renameAssetId) await File.update({ name, cluster_id }, { where: { id: renameAssetId } });

      File.findOne({where: {name: req.body.file.basic.name, application_id: applicationId}}).then(async (existingFile) => {
        let file = null;
        if(!existingFile) {
          file = await File.create(req.body.file.basic);
        } else {
          file = await File.update(req.body.file.basic, {where:{application_id: applicationId, id:req.body.id}}).then((updatedFile) => {
            return updatedFile;
          })
        }
        let fileId = file.id ? file.id : req.body.id;
        if(req.body.file.basic && req.body.file.basic.groupId) {
          let assetsGroupsCreated = await AssetsGroups.findOrCreate({
            where: {assetId: fileId, groupId: req.body.file.basic.groupId},
            defaults:{
              assetId: fileId,
              groupId: req.body.file.basic.groupId
            }
          })
        }
        this.updateFileDetails(fileId, applicationId, req).then((response) => {
          res.json(response);
        })
      })
    } catch (err) {
      console.log('err', err);
      return res.status(500).json({ success: false, message: "Error occured while saving file details" });
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
  try {
    File.destroy(
        {where:{id: req.body.fileId, application_id: req.body.application_id}}
    ).then(function(deleted) {
        FileLayout.destroy(
            {where:{ file_id: req.body.fileId }}
        ).then(function(layoutDeleted) {
            FileLicense.destroy(
                {where:{file_id: req.body.fileId}}
            ).then(function(licenseDeleted) {
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
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error occured while deleting file details" });
  }
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
  try {
    if(req.query.type == 'ecl') {
      fileService.getECLSchema(req.query.app_id, res)
    } else if (req.query.type == 'json') {
      fileService.getJSONSchema(req.query.app_id, res)
    }
  }catch (err) {
    return res.status(500).json({ success: false, message: "Error occured while downloading schema" });
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
      return res.status(500).json({ success: false, message: "Error occured while retrieving licenses" });
    });
  } catch (err) {
    console.log('err', err);
    return res.status(500).json({ success: false, message: "Error occured while retrieving licenses" });
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

router.post('/visualization', [
  body('id').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid file id'),
  body('application_id').isUUID(4).withMessage('Invalid application id'),
  body('email').isEmail().withMessage('Invalid email'),
  body('fileName').optional({checkFalsy:true}).matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\ -]*$/).withMessage('Invalid name'),
  body('clusterId').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid cluster'),
  body('groupId').optional({checkFalsy:true}).isInt().withMessage('Invalid groupId'),
  body('editingAllowed').isBoolean().withMessage('Invalid value for editingAllowed')
],async (req, res) => {  
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  console.log("[file visualization] - create visualization = " + req.body.id + " appId: "+req.body.application_id);
  try {
    let file=null, cluster=null, bodyObj={}, authToken='';    
    if(req.body.id) {
       file = await File.findOne({where: {id: req.body.id}});       
    } /*else if(req.body.fileName) {
      let fileInfo = await hpccUtil.fileInfo(req.body.fileName, req.body.clusterId);
      file = await File.create({...fileInfo.basic, cluster_id: req.body.clusterId, application_id: req.body.application_id});      
    } */
    console.log(file)
    if(file && file.cluster_id) {
      cluster = await Cluster.findOne({where: {id: file.cluster_id}});
    }
    console.log(cluster);    
    
    bodyObj = {      
      filename: file ? file.name : req.body.name,
      workspaceName: 'Tombolo', 
      dashboardName: (file && file.name) ? file.name : req.body.fileName,
      editingAllowed: req.body.editingAllowed
    };

    if(cluster) {
      bodyObj.cluster = {
        name: cluster.name,
        host: cluster.thor_host,
        infoPort: cluster.thor_port,
        dataPort: cluster.roxie_port,
      }
    }

    if (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) {
      authToken = req.headers['authorization'].slice(7, req.headers['authorization'].length)
    }
    console.log(bodyObj);
    request.post({
      url: process.env["REALBI_URL"] + '/api/v1/integration',
      body: JSON.stringify(bodyObj),
      headers: {'content-type' : 'application/json', 'Authorization': authToken},
    }, async function (err, response, body) {
      if (err) {
        console.log('ERROR - ', err);        
        return res.status(500).send("Error occured while creating visualization");
      } else {
        var result = JSON.parse(body);
        console.log(result);
        let viz = await Visualization.create({
          name: req.body.fileName ? req.body.fileName : file.name,
          application_id: req.body.application_id,
          url: result.workspaceUrl,
          type: req.body.type,
          description: req.body.description,
          assetId: file ? file.id : '',
          clusterId: file ? file.cluster_id : ''
        })
        if(req.body.groupId && req.body.groupId != '') {
          let assetsGroups = await AssetsGroups.findOrCreate({
            where: {assetId: viz.id, groupId: req.body.groupId},
            defaults:{
              assetId: viz.id,
              groupId: req.body.groupId
            }
          })        
        }
        res.json({"success": true, 'url': result.workspaceUrl});
      }
    });

  } catch(err) {
    console.log(err);
    return res.status(500).send("Error occured while creating visualization");
  }
});  

router.post('/deleteVisualization', [
  body('id')
    .isUUID(4).withMessage('Invalid id'),
],async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {

    let vizDestroyed = await Visualization.destroy({where: {id: req.body.id}});
    let assetsGroupsDestroyed = await  AssetsGroups.destroy({where: {assetId: req.body.id}})

    res.json({"success": true});
  }catch(err) {
    console.log(err);
    return res.status(500).send("Error occured while deleting visualization");
  }
});  

router.get('/getVisualizationDetails', [
  query('id').isUUID(4).withMessage('Invalid id'),
],async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    let visualization = await Visualization.findOne({where: {id: req.query.id}, attributes: ['id', 'name', 'url', 'description', 'clusterId']});
    res.json(visualization);
  }catch(err) {
    console.log(err);
    return res.status(500).send("Error occured while retrieving visualization details");
  }
});  

router.post('/tomboloFileSearch', [
  body('app_id').isUUID(4).withMessage('Invalid application id'),
  body('keyword').matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid keyword'),
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      let files = await assetUtil.fileSearch(req.body.app_id, req.body.keyword);
      res.json(files);
    } catch(err) {
      console.log(err);
      return res.status(500).send("Error occured while retrieving visualization details");
    }
  });

module.exports = router;