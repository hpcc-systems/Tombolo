const express = require('express');
const router = express.Router();
const { Job, DataflowVersion } = require('../../models');

const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const JobScheduler = require('../../jobSchedular/job-scheduler');
const assetUtil = require('../../utils/assets');
const logger = require('../../config/logger');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/response');

router.get(
  '/',
  [query('dataflowId').isUUID(4).withMessage('Invalid dataflow id')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { dataflowId } = req.query;

      const dataflowVersion = await DataflowVersion.findOne({
        where: { dataflowId, isLive: true },
        attributes: ['graph', 'name'],
      });

      return sendSuccess(res, {
        name: dataflowVersion?.name,
        graph: dataflowVersion?.graph,
      });
    } catch (error) {
      logger.error('dataflowgraph - get: ', error);
      return sendError(res, 'Unable to fetch the graph');
    }
  }
);

router.get(
  '/versions',
  [query('dataflowId').isUUID(4).withMessage('Invalid dataflow id')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return sendValidationError(res, errors.array());

    try {
      const { dataflowId } = req.query;
      const versions = await DataflowVersion.findAll({
        where: { dataflowId },
        attributes: [
          'id',
          'name',
          'isLive',
          'description',
          'createdBy',
          'createdAt',
        ],
        order: [['createdAt', 'ASC']],
      ]);
      return sendSuccess(res, versions);
    } catch (error) {
      logger.error('dataflowgraph - get: ', error);
      return sendError(res, error.message);
    }
  }
);

router.post(
  '/save_versions',
  [
    body('dataflowId').isUUID(4).withMessage('Invalid dataflow id'),
    body('name').notEmpty().escape().withMessage('Invalid version name'),
    body('description').optional({ checkFalsy: true }).escape(),
    body('graph').isObject().withMessage('Invalid graph'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const { name, description, dataflowId, graph } = req.body;
      const createdBy =
        req.authInfo?.email || req.user?.email || 'unknown user';

      const version = await DataflowVersion.create({
        name,
        description,
        graph,
        createdBy,
        dataflowId,
      });

      return res.status(200).send({
        id: version.id,
        isLive: version.isLive,
        name: version.name,
        description: version.description,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
      });
    } catch (error) {
      logger.error('dataflowgraph - save: ', error);
      return res.status(500).send({ message: error.message });
    }
  }
);

router.put(
  '/edit_version',
  [
    body('id').isUUID(4).withMessage('Invalid version id'),
    body('name').notEmpty().trim().escape().withMessage('Invalid version name'),
    body('description').optional({ checkFalsy: true }).trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const { name, description, id } = req.body;

      let version = await DataflowVersion.findOne({ where: { id } });
      if (!version) throw new Error('Version was not found');

      version = await version.update({ name, description });

      return res.status(200).send({
        id: version.id,
        name: version.name,
        description: version.description,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
      });
    } catch (error) {
      logger.error('dataflowgraph - edit: ', error);
      return res.status(500).send({ message: error.message });
    }
  }
);

router.delete(
  '/remove_version',
  [query('id').isUUID(4).withMessage('Invalid version id')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const { id } = req.query;

      const isRemoved = await DataflowVersion.destroy({ where: { id } });
      if (!isRemoved) throw new Error('Version was not removed!');

      return res.status(200).send({ success: true, id });
    } catch (error) {
      logger.error('dataflowgraph - remove_version: ', error);
      return res.status(500).send({ message: error.message });
    }
  }
);

router.get(
  '/change_versions',
  [query('id').isUUID(4).withMessage('Invalid version id')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });
    try {
      const { id } = req.query;

      const version = await DataflowVersion.findOne({
        where: { id },
        attributes: ['id', 'graph', 'name', 'description'],
      });
      if (!version) throw new Error('Version does not exist');

      return res.status(200).send(version);
    } catch (error) {
      logger.error('dataflowgraph - change_versions: ', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  '/version_live',
  [
    body('id').isUUID(4).withMessage('Invalid version id'),
    body('dataflowId').isUUID(4).withMessage('Invalid dataflow id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const { id, action, dataflowId } = req.body;

      if (action === 'pause') {
        const version = await DataflowVersion.findOne({
          where: { id },
          attributes: ['graph', 'id'],
        });
        if (!version) throw new Error('Version was not found');
        const monitorIds = version.graph.cells.reduce((acc, node) => {
          if (node.data?.isMonitoring) acc.push(node.data.assetId);
          return acc;
        }, []);

        for (const id of monitorIds)
          await assetUtil.deleteFileMonitoring({
            fileTemplateId: id,
            dataflowId,
          });

        await JobScheduler.removeAllFromBree(dataflowId);
        /* Update current dataflow with new version */
        await DataflowVersion.update(
          { isLive: false },
          { where: { dataflowId } }
        );
        return res.status(200).send({ id: version.id, isLive: false });
      }

      let newVersion = await DataflowVersion.findOne({
        where: { id },
        attributes: ['graph', 'id'],
      });
      if (!newVersion) throw new Error('Version was not found');

      // To change graph version we need to update file template monitoring and cron jobs with latest setup;
      const { newMonitorIds, cronjobs } = newVersion.graph.cells.reduce(
        (acc, node) => {
          if (node.data?.isMonitoring)
            acc.newMonitorIds.push(node.data.assetId);
          if (node.data?.schedule?.cron)
            acc.cronjobs.push({
              id: node.data.assetId,
              schedule: node.data.schedule,
            });
          return acc;
        },
        { newMonitorIds: [], cronjobs: [] }
      );

      // Get Live Version monitor Ids to adjust them
      const liveVersion = await DataflowVersion.findOne({
        where: { isLive: true, dataflowId },
        attributes: ['graph'],
      });

      let prevMonitorIds;
      if (!liveVersion) prevMonitorIds = [];
      else
        prevMonitorIds = liveVersion.graph.cells.reduce((acc, node) => {
          if (node.data?.isMonitoring) acc.push(node.data.assetId);
          return acc;
        }, []);

      /* FileMonitoring steps:
        - remove filemonitorings that are not in selected graph;
        - add file monitorings that were not in prev graph;
      */
      for (const id of prevMonitorIds) {
        if (!newMonitorIds.includes(id)) {
          await assetUtil.deleteFileMonitoring({
            fileTemplateId: id,
            dataflowId,
          });
        }
      }

      for (const id of newMonitorIds) {
        if (!prevMonitorIds.includes(id)) {
          await assetUtil.createFileMonitoring({
            fileTemplateId: id,
            dataflowId,
          });
        }
      }

      /* Cron job steps:
        - Remove all cron jobs for dataflow;
        - Add new cron jobs from selected graph;
      */
      await JobScheduler.removeAllFromBree(dataflowId);

      const jobs = await Job.findAll({
        where: { id: cronjobs.map(job => job.id) },
      });

      for (const job of jobs) {
        const schedule = cronjobs.find(
          cronJob => cronJob.id === job.id
        )?.schedule;
        if (schedule) {
          assetUtil.addJobToBreeSchedule(
            job,
            schedule,
            dataflowId,
            newVersion.id
          );
        }
      }

      /* Update current dataflow with new version */
      await DataflowVersion.update(
        { isLive: false },
        { where: { dataflowId } }
      );

      newVersion = await newVersion.update({ isLive: true });

      return res.status(200).send({ id: newVersion.id, isLive: true });
    } catch (error) {
      logger.error('dataflowgraph - version_live: ', error);
      return res.status(500).send({ message: error.message });
    }
  }
);

//!! NOT IN USE
// let updateNodeNameAndTitle = async nodes => {
//   let nodesWithName = [];
//   return new Promise(async (resolve, reject) => {
//     try {
//       for (const node of nodes) {
//         switch (node.type) {
//           case 'File' && node.fileId:
//             let file = await File.findOne({ where: { id: node.fileId } });
//             if (file) {
//               node.name = file.name;
//               node.title = file.title;
//             }
//             break;
//           case 'Job' && node.jobId:
//             let job = await Job.findOne({ where: { id: node.jobId } });
//             if (job) {
//               node.name = job.name;
//               node.title = job.title;
//             }
//             break;
//           case 'Index' && node.indexId:
//             let index = await Index.findOne({ where: { id: node.indexId } });
//             if (index) {
//               node.name = index.name;
//               node.title = index.title;
//             }
//             break;
//         }

//         nodesWithName.push(node);
//       }
//       resolve(nodesWithName);
//     } catch (err) {
//       logger.error('dataflowgraph - updateNodeNameAndTitle - error', err);
//       reject(err);
//     }
//   });
// };

module.exports = router;
