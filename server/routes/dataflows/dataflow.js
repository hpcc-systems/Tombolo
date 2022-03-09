const express = require('express');
const router = express.Router();
var models  = require('../../models');
let AssetDataflow = models.assets_dataflows;
let Dataflow = models.dataflow;
let DataflowGraph = models.dataflowgraph;
let Cluster = models.cluster;
let Index = models.indexes;
let File = models.file;
let Job = models.job;
let DependentJobs = models.dependent_jobs;
let JobExecution = models.job_execution;
const Dataflow_cluster_credentials = models.dataflow_cluster_credentials;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const jobScheduler = require('../../job-scheduler');
const {isClusterReachable} = require('../../utils/hpcc-util');
const {encryptString, decryptString} = require('../../utils/cipher')

router.post(
  '/save',
  [
    body('id').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid dataflow id'),
    body('application_id').isUUID(4).withMessage('Invalid application id'),
    body('clusterId').isUUID(4).withMessage('Invalid cluster id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
  const { id, application_id, title, description, clusterId, metaData } = req.body;
    // Get cluster port and host
    let clusterHost, port;
    try{
      let cluster =  await Cluster.findOne({where : {id : clusterId}});
      clusterHost = cluster.thor_host;
      port = cluster.thor_port
    }catch(err){
      console.log(err)
    }

    //Check if cluster is reachable
    const username = req.body.username || '';
    const password = req.body.password || '';
    const reachable = await isClusterReachable(clusterHost, port, username, password);

    console.log("Dataflow Save..."+reachable);
    if (reachable.statusCode === 503) {
      res.status(503).json({ success: false, message: 'Cluster not reachable' });
    } else if (reachable.statusCode === 403) {
      res.status(403).json({ success: false, message: 'Invalid cluster credentials' });
    } else {
      try {
        if (id) {
          // If id is available on req.body -> updating existing workflow
          const dataFlow = await Dataflow.findOne({ where: { id } });
          if (dataFlow) {
            await Dataflow.update(
              {
                application_id,
                title,
                type: 'main',
                description,
                clusterId,
                metaData,
              },
              { where: { id: id } }
            );

            await Dataflow_cluster_credentials.update(
              {
                cluster_id: clusterId,
                cluster_username: username,
                cluster_hash: encryptString(password),
              },
              { where: { dataflow_id: id } }
            );
            res.status(200).json({ success: true, message: 'Dataflow updated' });
          } else {
            // send error to front end - could not update no DF found
            res.status(404).json({ success: false, message: 'Unable to update dataflow - dataflow not found' });
          }
        } else {
          let newDataflow = await Dataflow.create({
            application_id,
            title,
            type: 'main',
            description,
            clusterId,
            metaData,
          });

          await Dataflow_cluster_credentials.create({
            dataflow_id: newDataflow.id,
            cluster_id: clusterId,
            cluster_username: username,
            cluster_hash: encryptString(password),
          });
          res.status(200).json({ success: true, message: 'Dataflow created successfully' });
        }
      } catch (err) {
        res.status(409).json({ success: false, message: 'Unable to create dataflow' });
      }
    }
  }
);

router.post('/saveAsset', (req, res) => {
  AssetDataflow.findOne({
    where: {
      assetId: req.body.assetId,
      dataflowId: req.body.dataflowId
    }
  }).then(async assetDataflow => {
    if (assetDataflow === null) {
      assetDataflow = await AssetDataflow.create({
        assetId: req.body.assetId,
        dataflowId: req.body.dataflowId
      });
      console.log(`assetDataflow created: ${JSON.stringify(assetDataflow.dataValues)}`);
      return res.json({ success: true, message: `asset ${assetDataflow.assetId} added to dataflow ${assetDataflow.dataflowId}` });
    }
    console.log(`assetDataflow found: ${JSON.stringify(assetDataflow.dataValues)}`);
    return res.json({ success: true, message: `asset ${assetDataflow.assetId} already associated to dataflow ${assetDataflow.dataflowId}` });
  });
});

router.get('/', [
  query('application_id')
    .isUUID(4).withMessage('Invalid cluster id')
],(req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
    console.log("[dataflow] - Get dataflow list for app_id = " + req.query.application_id);
    try {
        Dataflow.findAll(
          {
            where:{"application_Id":req.query.application_id},
            include: {model : Dataflow_cluster_credentials,
                      attributes: {exclude: ['cluster_hash']}},
            order: [
              ['createdAt', 'DESC']
            ],
          }).then(function(dataflow) {
            res.json(dataflow);
        })
        .catch(function(err) {
           res.status(500).json({success: false,  message : 'Unable to fetch dataflows'})
        });
    } catch (err) {
        console.log('err', err);
        res.status(500).json({success: false,  message : 'Unable to fetch dataflows'})
    }
});

router.post( '/delete',
  [
    body('applicationId').isUUID(4).withMessage('Invalid application_id'),
    body('dataflowId').isUUID(4).withMessage('Invalid dataflowId'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      await Promise.all([
        jobScheduler.removeAllDataflowJobs(req.body.dataflowId),
        // JobExecution.destroy({ where: { dataflowId: req.body.dataflowId } }), // !! will delete all job executions of this dataflow
        AssetDataflow.destroy({ where: { dataflowId: req.body.dataflowId } }),
        DependentJobs.destroy({ where: { dataflowId: req.body.dataflowId } }),
        Dataflow.destroy({ where: { id: req.body.dataflowId, application_id: req.body.applicationId } }),
        DataflowGraph.destroy({ where: { dataflowId: req.body.dataflowId, application_id: req.body.applicationId } }),
      ]);

      res.json({ result: 'success' });
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      res.status(422).json({ result: false, message: error.message });
    }
  }
);


router.get('/assets', [
  query('app_id')
    .isUUID(4).withMessage('Invalid application_id'),
  query('dataflowId')
    .isUUID(4).withMessage('Invalid dataflow id')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  console.log("[app/read.js] - App route called: "+req.query.app_id + " dataflowId: "+req.query.dataflowId);
  let results = [];

  Dataflow.findOne({
    where: {
      id: req.query.dataflowId
    },
    include: [{model: File, as: 'files'}, {model:Index, as: 'indexes'}, {model: Job, as: 'jobs', attributes: { exclude: ['assetId'] }}],
  }).then(data => {
    data.files.forEach(file => {
      results.push({
        'id': file.id,
        'title': file.title,
        'name': file.name,
        'description': file.description,
        'objType': 'file',
        'createdAt': file.createdAt,
        'contact': file.consumer
      });
    });
    data.indexes.forEach((index) => {
      results.push({
        'id': index.id,
        'title': index.title,
        'name': index.title,
        'description': index.description,
        'objType': 'index',
        'createdAt': index.createdAt,
        'contact':''
      });
    });
    data.jobs.forEach(job => {
      results.push({
        'id': job.id,
        'title': job.name,
        'name': job.name,
        'description': job.description,
        'objType': 'job',
        'createdAt': job.createdAt,
        'contact': job.contact
      });
    });
    res.json(results);
  });

  /*
    File.findAll({
      raw: true,
      attributes:["id","title","name","description"],
      where:{"application_id":req.query.app_id, "dataflowId":req.query.dataflowId}
    })
    .then((files) => {
      files.forEach((file) => {
        results.push({
            "id":file.id,
            "title":file.title,
            "name":file.name,
            "description":file.description,
            "objType": "file",
            "createdAt": file.createdAt,
            "contact": file.consumer
        })
      });
      return Job.findAll({
        raw: true,
        attributes:["id","name","description"],
        where:{"application_Id":req.query.app_id, "dataflowId":req.query.dataflowId}
      });
    })
    .then((jobs) => {
      jobs.forEach((job) => {
        results.push({
            "id":job.id,
            "title":job.name,
            "name":job.name,
            "description":job.description,
            "objType": "job",
            "createdAt": job.createdAt,
            "contact": job.contact
        })
      });
      return Index.findAll({
        raw: true,
        attributes:["id","title","description"],
        where:{"application_id":req.query.app_id, "dataflowId":req.query.dataflowId}}
      );
    })
    .then((indexes) => {
      indexes.forEach((index) => {
        results.push({
            "id":index.id,
            "title":index.title,
            "name":index.title,
            "description":index.description,
            "objType": "index",
            "createdAt": index.createdAt,
            "contact":""
        })
      })
      res.json(results);
    }).catch(function(err) {
        console.log(err);
    });
  */
});

router.get( '/checkAssetDataflows',
  [query('assetId').isUUID(4).withMessage('Invalid assetId')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    try {

      const assetsInDataflows = await AssetDataflow.findAll({
         where: { assetId: req.query.assetId },
         attributes:["dataflowId"]
        });

      const dataflows = await Dataflow.findAll({
        where:{ id: assetsInDataflows.map(ad => ad.dataflowId) },
        attributes:['id','application_id','title']
      });
      
      res.send(dataflows);
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({error}, { depth: null });
      console.log('------------------------------------------');
      
      res.status(500).send('Error occurred while checking asset in dataflows');
    }
  }
);


module.exports = router;