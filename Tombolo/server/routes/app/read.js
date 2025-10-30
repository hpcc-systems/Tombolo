// Library Imports
const express = require('express');
const path = require('path');
const fs = require('fs');
const Sequelize = require('sequelize');

// Local Imports
const {
  UserApplication,
  Application,
  Group,
  File,
  FileValidation,
  Indexes: Index,
  IndexKey,
  IndexPayload,
  Job,
  JobFile,
  JobParam,
  Query,
  QueryField,
  Dataflow,
  User,
} = require('../../models');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateGetAppByUsername,
  validateGetAppById,
  validateSaveApp,
  validateUnshareApp,
  validateExportApp,
} = require('../../middlewares/appMiddleware');
const { sendError, sendSuccess } = require('../../utils/response');
// const NotificationModule = require('../notifications/email-notification');
const jobScheduler = require('../../jobSchedular/job-scheduler');
const logger = require('../../config/logger');

// Constants & Config
const router = express.Router();
const Op = Sequelize.Op;

// Get all public apps and the ones that are associated with the user
router.get('/app_list', async (req, res) => {
  try {
    const { id: userId } = req.user;

    // 1. Get application IDs linked to the user
    const userApps = await UserApplication.findAll({
      where: { user_id: userId },
      attributes: ['application_id'],
      raw: true,
    });
    const userAppIds = userApps.map(app => app.application_id);

    // 2. Get all applications that are either linked to the user or are public
    const applications = await Application.findAll({
      where: {
        [Op.or]: [{ id: userAppIds }, { visibility: 'Public' }],
      },
      include: [
        {
          model: User,
          as: 'application_creator', // use the alias from your association
          attributes: { exclude: ['hash'] }, // exclude the hash field
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    return sendSuccess(res, applications);
  } catch (err) {
    logger.error(`Error occurred while getting application list: ${err}`);
    return sendError(res, 'Error occurred while getting application list');
  }
});

router.get(
  '/appListByUsername',
  validate(validateGetAppByUsername),
  async (req, res) => {
    const { user_name } = req.query;
    try {
      const userApplications = await UserApplication.findAll({
        where: { user_id: user_name },
        raw: true,
        attributes: ['application_id'],
      });
      const userApplicationIds = userApplications.map(
        app => app.application_id
      );
      const allApplications = await Application.findAll({
        where: {
          [Op.or]: [{ id: userApplicationIds }, { visibility: 'Public' }],
        },
        raw: true,
        order: [['updatedAt', 'DESC']],
      }); // this includes user created, public and shared apps
      return sendSuccess(res, allApplications);
    } catch (err) {
      logger.error('err', err);
      return sendError(res, 'Error occurred while getting application list');
    }
  }
);

router.get('/app', validate(validateGetAppById), async (req, res) => {
  try {
    const application = await Application.findOne({
      where: { id: req.query.app_id },
    });
    return sendSuccess(res, application);
  } catch (err) {
    logger.error('err', err);
    return sendError(res, 'Error occurred while getting application details');
  }
});

router.post(
  '/saveApplication',
  validate(validateSaveApp),
  async function (req, res) {
    try {
      if (req.body.id === '') {
        const application = await Application.create({
          title: req.body.title,
          description: req.body.description,
          creator: req.user.id,
          visibility: req.body.visibility,
        });
        if (req.user.id) {
          const userApp = await UserApplication.create({
            user_id: req.user.id,
            application_id: application.id,
            createdBy: req.user.id,
            user_app_relation: 'created',
          });

          return sendSuccess(
            res,
            {
              id: application.id,
              title: application.title,
              description: application.description,
              user_app_id: userApp.id,
            },
            'Application created successfully'
          );
        } else {
          return sendSuccess(
            res,
            { id: application.id },
            'Application created successfully'
          );
        }
      } else {
        const result = await Application.update(req.body, {
          where: { id: req.body.id },
        });
        return sendSuccess(
          res,
          { id: result.id },
          'Application updated successfully'
        );
      }
    } catch (err) {
      logger.error('saveApplication: ', err);
      return sendError(res, 'Error occurred while creating application');
    }
  }
);

// DELETE APPLICATION
router.post('/deleteApplication', async function (req, res) {
  try {
    let dataflows = await Dataflow.findAll({
      where: { application_id: req.body.appIdToDelete },
      raw: true,
      attributes: ['id'],
    });
    if (dataflows && dataflows.length > 0) {
      let dataflowIds = dataflows.map(dataflow => dataflow.id);
      await Dataflow.destroy({
        where: { application_id: req.body.appIdToDelete },
      });
      for (const id of dataflowIds) {
        await jobScheduler.removeAllFromBree(id);
      }
    }
    await UserApplication.destroy({
      where: { application_id: req.body.appIdToDelete, user_id: req.body.user },
    });
    const app = await Application.findOne({
      where: { id: req.body.appIdToDelete },
    });
    if (app.creator === req.body.user)
      await Application.destroy({ where: { id: req.body.appIdToDelete } });
    return sendSuccess(res, null, 'Application deleted successfully');
  } catch (err) {
    logger.error('err', err);
    return sendError(res, 'Error occurred while removing application');
  }
});

// SHARE APPLICATION
router.post('/shareApplication', async (req, res) => {
  const { data: appShareDetails } = req.body;

  try {
    await UserApplication.create(appShareDetails);
    // Can't wait for notification  email to be sent - might take longer ->Sending response to client as soon as the data is saved in userApplication table
    sendSuccess(res, null, 'Application shared successfully');
    try {
      NotificationModule.notifyApplicationShare(
        appShareDetails.user_id,
        appShareDetails.appTitle
      );
    } catch (err) {
      logger.error(
        'app/read.js - Error sending application share notification: ',
        err
      );
    }
  } catch (err) {
    logger.error('app/read.js - Share app error: ', err);
    return sendError(
      res,
      'Error occurred while saving user application mapping'
    );
  }
});

// UN-SHARE APPLICATION
router.post(
  '/stopApplicationShare',
  validate(validateUnshareApp),
  async (req, res) => {
    try {
      const { application_id, username: user_id } = req.body;
      await UserApplication.destroy({ where: { application_id, user_id } });
      return sendSuccess(res, null, 'Application sharing stopped successfully');
    } catch (err) {
      logger.error('stopApplicationShare: ', err);
      return sendError(res, err.message, 405);
    }
  }
);

router.post('/export', validate(validateExportApp), (req, res) => {
  try {
    let applicationExport = {};
    Application.findOne({
      where: { id: req.body.id },
    }).then(async application => {
      applicationExport = {
        application: {
          title: application.title,
          description: application.description,
          cluster: application.cluster,
        },
      };

      let groups = await Group.findAll({
        where: { application_id: req.body.id },
        attributes: { exclude: ['createdAt', 'updatedAt', 'application_id'] },
      });
      applicationExport.application.groups = groups;

      let files = await File.findAll({
        where: { application_id: application.id },
        include: [
          {
            model: FileValidation,
            attributes: {
              exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
            },
          },
          {
            model: Group,
            as: 'groups',
            attributes: ['id', 'name', 'description', 'parent_group'],
            through: {
              attributes: [],
            },
          },
          { model: Dataflow, as: 'dataflows', attributes: ['id'] },
        ],
      });

      let indexes = await Index.findAll({
        where: { application_id: application.id },
        include: [
          {
            model: IndexKey,
            attributes: {
              exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
            },
          },
          {
            model: IndexPayload,
            attributes: {
              exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
            },
          },
          {
            model: Group,
            as: 'groups',
            attributes: ['id', 'name', 'description', 'parent_group'],
            through: {
              attributes: [],
            },
          },
          { model: Dataflow, as: 'dataflows', attributes: ['id'] },
        ],
        attributes: {
          exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
        },
      });

      let queries = await Query.findAll({
        where: { application_id: application.id },
        include: [
          {
            model: QueryField,
            attributes: {
              exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
            },
          },
          {
            model: Group,
            as: 'groups',
            attributes: ['id', 'name', 'description', 'parent_group'],
            through: {
              attributes: [],
            },
          },
          { model: Dataflow, as: 'dataflows', attributes: ['id'] },
        ],
        attributes: {
          exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
        },
      });

      let jobs = await Job.findAll({
        where: { application_id: application.id },
        include: [
          {
            model: JobFile,
            attributes: {
              exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
            },
          },
          {
            model: JobParam,
            attributes: {
              exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
            },
          },
          {
            model: Group,
            as: 'groups',
            attributes: ['id', 'name', 'description', 'parent_group'],
            through: {
              attributes: [],
            },
          },
          { model: Dataflow, as: 'dataflows', attributes: ['id'] },
        ],
        attributes: {
          exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
        },
      });

      let dataflow = await Dataflow.findAll({
        where: { application_id: application.id },
        attributes: {
          exclude: ['createdAt', 'updatedAt', 'id', 'application_id'],
        },
      });

      applicationExport.application.assets = {
        files: files,
        indexes: indexes,
        queries: queries,
        jobs: jobs,
        dataflow: dataflow,
      };

      var schemaDir = path.join(__dirname, '..', '..', 'schemas');
      if (!fs.existsSync(schemaDir)) {
        fs.mkdirSync(schemaDir);
      }
      var exportFile = path.join(
        __dirname,
        '..',
        '..',
        'schemas',
        application.title + '-export.json'
      );

      fs.appendFile(
        exportFile,
        JSON.stringify(applicationExport, null, 4),
        function (err) {
          if (err)
            return res
              .status(500)
              .send('Error occurred while exporting application');
          res.download(exportFile, function (err) {
            if (err) {
              logger.error('app/read - Error downloading file:');
              return res
                .status(500)
                .send('Error occurred while exporting application');
            } else {
              logger.verbose('Download completed....');
              fs.unlink(exportFile, err => {
                if (err)
                  return res
                    .status(500)
                    .send('Error occurred while exporting application');
                logger.info(exportFile + ' was deleted after download');
              });
            }
          });
        }
      );

      //res.json(applicationExport);
    });
  } catch (err) {
    logger.error('err', err);
    return sendError(res, 'Error occurred while exporting application');
  }
});

module.exports = router;
