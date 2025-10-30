const express = require('express');
const router = express.Router();
const {
  Cluster,
  Indexes: Index,
  File,
  Job,
  DataflowClusterCredential,
  DataflowVersion,
  Dataflow,
} = require('../../models');

const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const jobScheduler = require('../../jobSchedular/job-scheduler');
const { isClusterReachable } = require('../../utils/hpcc-util');
const assetUtil = require('../../utils/assets');
const { encryptString } = require('../../utils/cipher');
const logger = require('../../config/logger');
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require('../../utils/response');

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
      return sendValidationError(res, errors.array());
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
      logger.error('dataflow save - failed to get cluster: ', err);
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

        await DataflowClusterCredential.create({
          dataflow_id: newDataflow.id,
          cluster_id: clusterId,
          cluster_username: username,
          cluster_hash: encryptString(password),
        });

        return sendSuccess(res, null, 'Dataflow created successfully');
      }

      // If id is available on req.body -> updating existing workflow
      const dataFlow = await Dataflow.findOne({ where: { id } });

      if (!dataFlow) {
        // send error to front end - could not update no DF found
        return sendError(
          res,
          'Unable to update dataflow - dataflow not found',
          404
        );
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

      await DataflowClusterCredential.update(
        {
          cluster_id: clusterId,
          cluster_username: username,
          cluster_hash: encryptString(password),
        },
        { where: { dataflow_id: id } }
      );
      return sendSuccess(res, null, 'Dataflow updated successfully');
    } catch (err) {
      logger.error('dataflow save: ', err);
      return sendError(res, 'Unable to create dataflow', 409);
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
      return sendValidationError(res, errors.array());
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
          model: DataflowClusterCredential,
          attributes: { exclude: ['cluster_hash'] },
        },
        order: [['createdAt', 'DESC']],
      });

      return sendSuccess(res, dataFlow);
    } catch (err) {
      logger.error('err', err);
      return sendError(res, 'Unable to fetch dataflows');
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
      return sendValidationError(res, errors.array());
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

      return sendSuccess(res, null, 'Dataflow deleted successfully');
    } catch (error) {
      logger.error('dataflow delete: ', error);
      return sendError(res, error.message, 422);
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
      return sendValidationError(res, errors.array());
    }
    let results = [];

    try {
      const dataFlow = await Dataflow.findOne({
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

      dataFlow.indexes.forEach(index => {
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

      return sendSuccess(res, results);
    } catch (err) {
      logger.error('dataflow assets: ', err);
      return sendError(res, err.message || err);
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
        logger.error('dataflow: ', err);
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
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { assetId } = req.query;

      const dataflowVersions = await DataflowVersion.findAll({
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

      return sendSuccess(res, inDataflows);
    } catch (error) {
      logger.error('dataflow/checkDataflows: ', error);
      return sendError(res, 'Error occurred while checking asset in dataflows');
    }
  }
);

module.exports = router;
