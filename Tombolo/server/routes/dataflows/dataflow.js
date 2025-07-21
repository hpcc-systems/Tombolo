const express = require('express');
const router = express.Router();
var models = require('../../models');

let Dataflow = models.dataflow;
const DataflowVersions = models.dataflow_versions;

let Cluster = models.cluster;
let Index = models.indexes;
let File = models.file;
let Job = models.job;
const Dataflow_cluster_credentials = models.dataflow_cluster_credentials;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const jobScheduler = require('../../jobSchedular/job-scheduler');
const { isClusterReachable } = require('../../utils/hpcc-util');
const assetUtil = require('../../utils/assets');
const { encryptString } = require('../../utils/cipher');
const logger = require('../../config/logger');

router.post(
  '/save',
  [
    body('id')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid dataflow id'),
    body('application_id').isUUID(4).withMessage('Invalid application id'),
    body('clusterId').isUUID(4).withMessage('Invalid cluster id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const { id, application_id, title, description, clusterId, metaData } =
      req.body;
    // Get cluster port and host
    let clusterHost, port;
    try {
      let cluster = await Cluster.findOne({ where: { id: clusterId } });
      clusterHost = cluster.thor_host;
      port = cluster.thor_port;
    } catch (err) {
      logger.error(err);
    }

    //Check if cluster is reachable
    const username = req.body.username || '';
    const password = req.body.password || '';
    const reachable = await isClusterReachable(
      clusterHost,
      port,
      username,
      password
    );

    logger.info('Dataflow Save...' + reachable);

    if (reachable.statusCode === 503) {
      return res
        .status(503)
        .json({ success: false, message: 'Cluster not reachable' });
    }

    if (reachable.statusCode === 403) {
      return res
        .status(403)
        .json({ success: false, message: 'Invalid cluster credentials' });
    }

    try {
      if (!id) {
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

        return res
          .status(200)
          .json({ success: true, message: 'Dataflow created successfully' });
      }

      // If id is available on req.body -> updating existing workflow
      const dataFlow = await Dataflow.findOne({ where: { id } });

      if (!dataFlow) {
        // send error to front end - could not update no DF found
        return res.status(404).json({
          success: false,
          message: 'Unable to update dataflow - dataflow not found',
        });
      }

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
      return res
        .status(200)
        .json({ success: true, message: 'Dataflow updated' });
    } catch (err) {
      logger.error(err);
      return res
        .status(409)
        .json({ success: false, message: 'Unable to create dataflow' });
    }
  }
);

router.get(
  '/',
  [
    query('application_id').isUUID(4).withMessage('Invalid cluster id'),
    query('dataflow_id')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid cluster id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const searchParams = { application_Id: req.query.application_id };
      if (req.query.dataflow_id) searchParams.id = req.query.dataflow_id;

      const dataFlow = await Dataflow.findAll({
        where: searchParams,
        attributes: {
          exclude: ['graph'],
        },
        include: {
          model: Dataflow_cluster_credentials,
          attributes: { exclude: ['cluster_hash'] },
        },
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json(dataFlow);
    } catch (err) {
      logger.error('err', err);
      res
        .status(500)
        .json({ success: false, message: 'Unable to fetch dataflows' });
    }
  }
);

router.post(
  '/delete',
  [
    body('applicationId').isUUID(4).withMessage('Invalid application_id'),
    body('dataflowId').isUUID(4).withMessage('Invalid dataflowId'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { dataflowId, applicationId } = req.body;

    const dataflow = await Dataflow.findOne({
      where: { id: dataflowId },
      attributes: ['graph'],
    });
    const filetemplates =
      dataflow.graph?.cells?.filter(
        cell => cell?.data?.type === 'FileTemplate'
      ) || [];

    if (filetemplates.length > 0) {
      const promises = filetemplates.map(filetemplate => {
        return assetUtil.deleteFileMonitoring({
          fileTemplateId: filetemplate.data.assetId,
          dataflowId,
        });
      });
      await Promise.all(promises);
    }

    try {
      await Promise.all([
        jobScheduler.removeAllFromBree(dataflowId),
        Dataflow.destroy({
          where: { id: dataflowId, application_id: applicationId },
        }),
      ]);

      return res.status(200).json({ result: 'success' });
    } catch (error) {
      logger.error('-error-----------------------------------------');
      logger.error(error);
      logger.error('------------------------------------------');
      return res.status(422).json({ result: false, message: error.message });
    }
  }
);

router.get(
  '/assets',
  [
    query('app_id').isUUID(4).withMessage('Invalid application_id'),
    query('dataflowId').isUUID(4).withMessage('Invalid dataflow id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    let results = [];

    try {
      const dataFlow = Dataflow.findOne({
        where: {
          id: req.query.dataflowId,
        },
        include: [
          { model: File, as: 'files' },
          { model: Index, as: 'indexes' },
          { model: Job, as: 'jobs', attributes: { exclude: ['assetId'] } },
        ],
      });
      dataFlow.files.forEach(file => {
        results.push({
          id: file.id,
          title: file.title,
          name: file.name,
          description: file.description,
          objType: 'file',
          createdAt: file.createdAt,
          contact: file.consumer,
        });
      });

      dataflow.indexes.forEach(index => {
        results.push({
          id: index.id,
          title: index.title,
          name: index.title,
          description: index.description,
          objType: 'index',
          createdAt: index.createdAt,
          contact: '',
        });
      });

      dataFlow.jobs.forEach(job => {
        results.push({
          id: job.id,
          title: job.name,
          name: job.name,
          description: job.description,
          objType: 'job',
          createdAt: job.createdAt,
          contact: job.contact,
        });
      });

      return res.status(200).json(results);
    } catch (err) {
      logger.error(err);
      return res.status(500).json({ error: err });
    }

    /* // This would go inside the try block above
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
      return res.status(200).json(results);
    }).catch(function(err) {
        logger.error(err);
        return res.status(500).json({ error: err });
    });
  */
  }
);

router.get(
  '/checkDataflows',
  [query('assetId').isUUID(4).withMessage('Invalid assetId')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const { assetId } = req.query;

      const dataflowVersions = await DataflowVersions.findAll({
        where: { isLive: true },
        include: [{ model: Dataflow, attributes: ['title'] }],
        attributes: ['dataflowId', 'name', 'graph'],
      });

      const inDataflows = [];

      for (const dataflowVersion of dataflowVersions) {
        const cells = dataflowVersion?.graph?.cells;
        if (cells) {
          const asset = cells.find(cell => cell.data?.assetId === assetId);
          if (asset) {
            inDataflows.push({
              dataflowId: dataflowVersion.dataflowId,
              title: dataflowVersion.dataflow.title,
            });
          }
        }
      }

      return res.status(200).send(inDataflows);
    } catch (error) {
      logger.error('-error-----------------------------------------');
      logger.error(error);
      logger.error('------------------------------------------');

      return res
        .status(500)
        .send('Error occurred while checking asset in dataflows');
    }
  }
);

module.exports = router;
