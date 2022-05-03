const express = require('express');
const router = express.Router();
var models  = require('../../models');
let File = models.file;
let FileLayout = models.file_layout;
let Sequelize = require('sequelize');
const Op = Sequelize.Op;

let Indexes=models.indexes;
let IndexKey=models.index_key;
let IndexPayload=models.index_payload;
let Query=models.query;
let QueryField=models.query_field;
let Job=models.job;
let Jobparam=models.jobparam;
let Application=models.application;
let ControlsAndRegulations = models.controls_regulations;
let Dataflow = models.dataflow;
let DataflowGraph = models.dataflowgraph;

const { body, query, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');

router.get('/fileLayout', (req, res) => {
    console.log("[fileLayout/read.js] - Get file Layout for file_id "+req.query.file_id);
    var basic = {}, results={};
    try {
        FileLayout.findAll({where:{"file_id":req.query.file_id}}).then(function(fileLayouts) {
            res.json(fileLayouts)
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});
router.get('/fileLayoutAndComplianceChart', (req, res) => {
    console.log("[fileLayoutAndComplianceChart/read.js] - Get file Layout and chart data for file_id "+req.query.file_id);
    var basic = {}, results={};
    try {
        FileLayout.findAll({where:{"file_id":req.query.file_id}}).then(function(fileLayouts) {
        results.fileLayout=fileLayouts;

        ControlsAndRegulations.findAll({
            attributes: [
              'compliance',
              [Sequelize.fn('GROUP_CONCAT', Sequelize.col('data_types')), 'data_types']
            ],
            group: ['compliance']
          }).then(function(regulations) {
            if(regulations){
                var chartData=[];
                var count=0;
                regulations.forEach(function(doc, idx) {
                    var chart={};
                    chart.compliance = doc.compliance;
                    FileLayout.findAll({
                        where: {"file_id":req.query.file_id,
                         "data_types": {
                                 [Op.in]: Sequelize.literal(
                                 '( select data_types from controls_regulations '+
                                'where compliance="'+doc.compliance+'")')}
                             }
                    })
                    .then(function(fileLayouts) {
                        count++;
                        chart.fileLayout=fileLayouts;
                        chart.count=fileLayouts.length;
                        chartData.push(chart);
                        if(count==regulations.length)
                        {
                            var chartval={};
                            chartval.compliance = "others";
                            FileLayout.findAll({
                                where: {"file_id":req.query.file_id,
                                [Op.or]:[
                                   {"data_types": {
                                   [Op.notIn]: Sequelize.literal(
                                   '( select data_types from controls_regulations )')
                                   }},
                                   {"data_types": {
                                       [Op.eq]: null
                                      }
                                    }]
                             } })
                            .then(function(fileLayouts) {
                                chartval.fileLayout=fileLayouts;
                                chartval.count=fileLayouts.length;
                                chartData.push(chartval);
                                results.chartData=chartData;
                                res.json(results);
                            })
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
                });
            } else {
                res.json(results);
            }
        })
        .catch(function(err) {
            console.log(err);
        });
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/indexKeyPayload', (req, res) => {
    console.log("[indexKeyPayload/read.js] - Get index key and payload details for  index_id "+req.query.index_id);
    var basic = {}, results={};
    try {
        Indexes.findOne({where:{"id":req.query.index_id}, include: [IndexKey, IndexPayload]}).then(function(indexes) {
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
router.get('/query_Fields', (req, res) => {
    console.log("[query list/read.js] - Get query Fields for query_id: "+req.query.query_id);
    try {
        Query.findOne({where:{"id":req.query.query_id}, include: [QueryField]}).then(function(query) {
            res.json(query);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});
router.get('/jobParams', (req, res) => {
    console.log("[jobParams] - Get job Params list for job_id: "+req.query.job_id);
    let jobFiles = [];
    try {
        Job.findOne({where:{"id":req.query.job_id}, include: [Jobparam]}).then(function(job) {
            res.json(job);
        })
        .catch(function(err) {
            console.log(err);
        });
    } catch (err) {
        console.log('err', err);
    }
});
router.get('/getReport', (req, res) => {
    var result={};
    var searchText=(req.query.searchText).toLowerCase();
    try {
      File.findAll({
          raw: true,
          attributes:["file.id","file.title","file.name","file.fileType","file.description",
          "file.qualifiedPath"],
          group: ['file.id',"file.title","file.name","file.fileType","file.description",
          "file.qualifiedPath","application.title"],
          where:Sequelize.and(
              Sequelize.where(Sequelize.col("file.application_id"), {
              [Op.in]: [req.query.applicationId]
              }),
          Sequelize.or(
          Sequelize.where(Sequelize.fn('lower', Sequelize.fn("concat",
          Sequelize.fn('IFNULL',Sequelize.col("file.title"),"")," ",
          Sequelize.fn('IFNULL',Sequelize.col("file.name"),"")," ",
          Sequelize.fn('IFNULL',Sequelize.col("file.fileType"),"")," ",
          Sequelize.fn('IFNULL',Sequelize.col("file.description"),"")," ",
          Sequelize.fn('IFNULL',Sequelize.col("file.qualifiedPath"),""))), {
                  [Op.like]: '%'+searchText+'%'
          }),
          Sequelize.where(Sequelize.fn('lower',Sequelize.fn("concat",
          Sequelize.fn('IFNULL',Sequelize.col("file_layouts.name"),"")," ",
          Sequelize.fn('IFNULL',Sequelize.col("file_layouts.type"),""))), {
                  [Op.like]: '%'+searchText+'%'
          }),
          Sequelize.where(Sequelize.fn('lower',
          Sequelize.fn('IFNULL',Sequelize.col("application.title"),"")), {
                  [Op.like]: '%'+searchText+'%'
          }),

      )),
          include:
          [{ model: Application, attributes:["title"] },{ model: FileLayout,attributes:[]}]
      }).then(function(file) {
          result.file=file;

          Indexes.findAll({
              raw: true,
              attributes:["indexes.id","indexes.title","indexes.name","indexes.description",
              "indexes.qualifiedPath"],
              group: ["indexes.id","indexes.title","indexes.name","indexes.description",
              "indexes.qualifiedPath","application.title"],
              where:Sequelize.and(
              Sequelize.where(Sequelize.col("indexes.application_id"), {
              [Op.in]: [req.query.applicationId]
              }),
              Sequelize.or(
              Sequelize.where(Sequelize.fn('lower',Sequelize.fn("concat",
              Sequelize.fn('IFNULL',Sequelize.col("indexes.title"),"")," ",
              Sequelize.fn('IFNULL',Sequelize.col("indexes.name"),"")," ",
              Sequelize.fn('IFNULL',Sequelize.col("indexes.description"),"")," ",
              Sequelize.fn('IFNULL',Sequelize.col("indexes.primaryService"),"")," ",
              Sequelize.fn('IFNULL',Sequelize.col("indexes.qualifiedPath"),""))), {
                      [Op.like]: '%'+searchText+'%'
              }),
              Sequelize.where(Sequelize.fn('lower',Sequelize.fn("concat",
              Sequelize.fn('IFNULL',Sequelize.col("index_keys.name"),"")," ",
              Sequelize.fn('IFNULL',Sequelize.col("index_keys.type"),"")," ",
              Sequelize.fn('IFNULL',Sequelize.col("index_keys.eclType"),""))), {
                      [Op.like]: '%'+searchText+'%'
              }),
              Sequelize.where(Sequelize.fn('lower',Sequelize.fn("concat",
              Sequelize.fn('IFNULL',Sequelize.col("index_payloads.name"),"")," ",
              Sequelize.fn('IFNULL',Sequelize.col("index_payloads.type"),"")," ",
              Sequelize.fn('IFNULL',Sequelize.col("index_payloads.eclType"),""))), {
                      [Op.like]: '%'+searchText+'%'
              }),
              Sequelize.where(Sequelize.fn('lower',
              Sequelize.fn('IFNULL',Sequelize.col("application.title"),"")), {
                      [Op.like]: '%'+searchText+'%'
              })
              )),
              include:
              [{ model: Application, attributes:["title"] },{ model: IndexKey, attributes:[] },
              { model: IndexPayload , attributes:[]}]
          }).then(index => {
              result.index=index;

              Query.findAll({
                  raw: true,
                  attributes:["query.id","query.title","query.name","query.backupService","query.primaryService",
                  "query.gitRepo"],
                  group: ["query.id","query.title","query.backupService","query.primaryService",
                  "query.gitRepo","application.title"],
                  where:Sequelize.and(
                  Sequelize.where(Sequelize.col("query.application_id"), {
                  [Op.in]: [req.query.applicationId]
                  }),
                  Sequelize.or(Sequelize.where(Sequelize.fn('lower',Sequelize.fn("concat",
                  Sequelize.fn('IFNULL',Sequelize.col("query.title"),'')," ",
                  Sequelize.fn('IFNULL',Sequelize.col("query.name"),'')," ",
                  Sequelize.fn('IFNULL',Sequelize.col("query.gitRepo"),'')," ",
                  Sequelize.fn('IFNULL',Sequelize.col("query.primaryService"),'')," ",
                  Sequelize.fn('IFNULL',Sequelize.col("query.backupService"),''))), {
                          [Op.like]: '%'+searchText+'%'
                  }),
                  Sequelize.where(Sequelize.fn('lower',Sequelize.fn("concat",
                  Sequelize.fn('IFNULL',Sequelize.col("query_fields.field_type"),"")," ",
                  Sequelize.fn('IFNULL',Sequelize.col("query_fields.name"),"")," ",
                  Sequelize.fn('IFNULL',Sequelize.col("query_fields.type"),""))), {
                          [Op.like]: '%'+searchText+'%'
                  }),
                  Sequelize.where(Sequelize.fn('lower',
                  Sequelize.fn('IFNULL',Sequelize.col("application.title"),"")), {
                          [Op.like]: '%'+searchText+'%'
                  })
              )),
              include:
              [{ model: Application, attributes:["title"] },{ model: QueryField, attributes:[] }]
              }).then(query => {
                  result.query=query;

                  Job.findAll({
                      raw: true,
                      attributes:["job.id","job.name","job.author","job.contact",
                      "job.entryBWR","job.gitRepo","job.JobType"],
                      group: ["job.id","job.name","job.author","job.contact",
                      "job.entryBWR","job.gitRepo","job.JobType","application.title"],
                      where:Sequelize.and(
                      Sequelize.where(Sequelize.col("job.application_id"), {
                      [Op.in]: [req.query.applicationId]
                      }),
                      Sequelize.or(Sequelize.where(Sequelize.fn('lower',Sequelize.fn("concat",
                      Sequelize.fn('IFNULL',Sequelize.col("job.name"),"")," ",
                      Sequelize.fn('IFNULL',Sequelize.col("job.author"),"")," ",
                      Sequelize.fn('IFNULL',Sequelize.col("job.contact"),"")," ",
                      Sequelize.fn('IFNULL',Sequelize.col("job.entryBWR"),"")," ",
                      Sequelize.fn('IFNULL',Sequelize.col("job.gitRepo"),"")," ",
                      Sequelize.fn('IFNULL',Sequelize.col("job.JobType"),""))), {
                              [Op.like]: '%'+searchText+'%'
                      }),
                      Sequelize.where(Sequelize.fn('lower',Sequelize.fn("concat",
                      Sequelize.fn('IFNULL',Sequelize.col("jobparams.name"),"")," ",
                      Sequelize.fn('IFNULL',Sequelize.col("jobparams.type"),""))), {
                              [Op.like]: '%'+searchText+'%'
                      }),
                      Sequelize.where(Sequelize.fn('lower',
                      Sequelize.fn('IFNULL',Sequelize.col("application.title"),"")), {
                              [Op.like]: '%'+searchText+'%'
                      })
                  )),
                  include:
                  [{ model: Application, attributes:["title"] },{ model: Jobparam, attributes:[] }]
                  }).then(job => {
                      result.job=job;
                      res.json(result);
                  });
              });
          });
      });

    } catch (err) {
        console.log('err', err);
    }
});

router.get( '/associatedDataflows',
    [
      query('assetId').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid asset id'),
      query('type')
        .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:\-]*$/)
        .withMessage('Invalid type'),
    ],
    async (req, res) => {
      const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
  
      console.log('[/associatedDataflows] - Get associated dataflows for : ' + req.query.assetId);
  
      try {
        const { application_id, assetId } = req.query;
  
        const dataflows = await Dataflow.findAll({
          where: { application_id },
          attributes: ['id', 'title', 'clusterId', 'description'],
          include: { model: DataflowGraph, attributes: ['graph'] },
        });
  
        const inDataflows = [];
  
        for (const dataflow of dataflows) {
          const cells = dataflow.dataflowgraph?.graph?.cells;
          if (cells) {
            const asset = cells.find((cell) => cell.data?.assetId === assetId);
            if (asset) {
              inDataflows.push({
                application_id,
                id: dataflow.id,
                title: dataflow.title,
                description: dataflow.description,
                clusterId: dataflow.clusterId,
              });
            }
          }
        }        
  
        res.send(inDataflows);
      } catch (error) {
        console.log('-error-----------------------------------------');
        console.dir({ error }, { depth: null });
        console.log('------------------------------------------');
  
        res.status(500).send('Error occurred while checking asset in dataflows');
      }
    }
  );
  

module.exports = router;