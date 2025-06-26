// Library Imports
const express = require('express');
const path = require('path');
const fs = require('fs');
const Sequelize = require('sequelize');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const sanitize = require('sanitize-filename');

// Local Imports
const models = require('../../models');
const { io } = require('../../server');
const validatorUtil = require('../../utils/validator');
const NotificationModule = require('../notifications/email-notification');
const jobScheduler = require('../../jobSchedular/job-scheduler');
const logger = require('../../config/logger');

// Constants & Config
const router = express.Router();
const Op = Sequelize.Op;

// Model Shortcuts
const UserApplication = models.user_application;
const Application = models.application;
const Groups = models.groups;
const File = models.file;
const FileValidation = models.file_validation;
const Index = models.indexes;
const IndexKey = models.index_key;
const IndexPayload = models.index_payload;
const Job = models.job;
const JobFile = models.jobfile;
const JobParam = models.jobparam;
const Query = models.query;
const QueryField = models.query_field;
const Dataflow = models.dataflow;
const AssetGroups = models.assets_groups;

// Get all public apps and the ones that are associated with the user
router.get('/app_list', async (req, res) => {
  try {
    const { id: userId } = req.user;

    // 1. Get application IDs linked to the user
    const userApps = await models.user_application.findAll({
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
          model: models.user,
          as: 'application_creator', // use the alias from your association
          attributes: { exclude: ['hash'] }, // exclude the hash field
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    return res.status(200).json(applications);
  } catch (err) {
    logger.error(`Error occurred while getting application list: ${err}`);
    return res.status(500).json({
      success: false,
      message: 'Error occurred while getting application list',
    });
  }
});

router.get(
  '/appListByUsername',
  [query('user_name').notEmpty().withMessage('Invalid username')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
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
      return res.status(200).json(allApplications);
    } catch (err) {
      logger.error('err', err);
      return res.status(500).json({
        success: false,
        message: 'Error occurred while getting application list',
      });
    }
  }
);

router.get(
  '/app',
  [query('app_id').isUUID(4).withMessage('Invalid application id')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const application = await Application.findOne({
        where: { id: req.query.app_id },
      });
      return res.status(200).json(application);
    } catch (err) {
      logger.error('err', err);
      return res.status(500).json({
        success: false,
        message: 'Error occured while getting application details',
      });
    }
  }
);

router.post(
  '/saveApplication',
  [
    body('user_id')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid user_id'),
    body('title')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_: .\-]*$/)
      .withMessage('Invalid title'),
    body('description').optional({ checkFalsy: true }),
    body('creator').isUUID(4).withMessage('Invalid creator'),
    body('visibility')
      .matches(/^[a-zA-Z]/)
      .withMessage('Invalid visibility'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      if (req.body.id == '') {
        req.body.createdBy = req.body.creator;
        const application = await Application.create({
          title: req.body.title,
          description: req.body.description,
          creator: req.body.creator,
          visibility: req.body.visibility,
          createdBy: req.body.createdBy,
        });
        if (req.body.user_id) {
          const userApp = await UserApplication.create({
            user_id: req.body.user_id,
            application_id: application.id,
            createdBy: req.body.createdBy,
            user_app_relation: 'created',
          });

          return res.json({
            result: 'success',
            id: application.id,
            title: application.title,
            description: application.description,
            user_app_id: userApp.id,
          });
        } else {
          return res.json({ result: 'success', id: application.id });
        }
      } else {
        const result = await Application.update(req.body, {
          where: { id: req.body.id },
        });
        return res.json({ result: 'success', id: result.id });
      }
    } catch (err) {
      logger.error(err);
      return res.status(500).json({
        success: false,
        message: 'Error occured while creating application',
      });
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
    return res.status(200).send({ result: 'success' });
  } catch (err) {
    logger.error('err', err);
    return res.status(500).json({
      success: false,
      message: 'Error occurred while removing application',
    });
  }
});

// SHARE APPLICATION
router.post('/shareApplication', [], async (req, res) => {
  const { data: appShareDetails } = req.body;

  try {
    await UserApplication.create(appShareDetails);
    // Can't wait for notification  email to be sent - might take longer ->Sending response to client as soon as the data is saved in userApplication table
    res.status(200).json({ result: 'success' });
    try {
      NotificationModule.notifyApplicationShare(
        appShareDetails.user_id,
        appShareDetails.appTitle
      );
    } catch (err) {
      logger.error(
        '--- [app/read.js] Error sending application share notification -----------'
      );
      logger.error(err);
      logger.error(
        '--------------------------------------------------------------------------'
      );
    }
  } catch (err) {
    logger.error('--- Share app error [app/read.js] --------------');
    logger.error(err);
    logger.error('------------------------------------------------');
    return res.status(500).json({
      success: false,
      message: 'Error occurred while saving user application mapping',
    });
  }
});

// UN-SHARE APPLICATION
router.post(
  '/stopApplicationShare',
  [
    body('application_id').isUUID(4).withMessage('Invalid application ID'),
    body('username').notEmpty().withMessage('Invalid username'),
  ],
  async (req, res) => {
    logger.verbose('------------------------------------------');
    logger.verbose(req.body);
    logger.verbose('------------------------------------------');
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const { application_id, username: user_id } = req.body;
      await UserApplication.destroy({ where: { application_id, user_id } });
      return res.status(200).json({ success: true, message: 'Success' });
    } catch (err) {
      logger.error(err);
      return res.status(405).json({ success: false, message: err.message });
    }
  }
);

//Import application
let upload = multer();
upload = multer({ dest: 'tempFiles/' });
let allPromises = [];

// Remove file
const removeFile = filePath => {
  const isFileNameValid = /^[a-zA-Z0-9/]*$/.test(filePath);
  if (!isFileNameValid) {
    emitUpdates(io, {
      step: 'ERR - Invalid file name or type',
      status: 'error',
    });
  }
  fs.unlink(filePath, err => {
    if (err) {
      logger.error('Error deleting file: ', err);
    }
  });
};

//validate JSON
const validateJSON = (data, filePath) => {
  try {
    var data = JSON.parse(data);
    removeFile(filePath);
    return data;
  } catch {
    removeFile(filePath);
    return 'error';
  }
};

//Emmit message with socket io
const emitUpdates = (io, message) => {
  return io.emit('message', JSON.stringify(message));
};
//1. #### import root groups
function importRootGroups(
  newAppId,
  importingGroups,
  groupIdMap,
  numberOfAttemptedImport,
  assetData,
  io,
  res,
  app
) {
  let promises = [];
  emitUpdates(io, { step: 'Importing root groups', status: 'normal' });
  importingGroups.map((item, index) => {
    if (item.parent_group == '') {
      item.doneImportingGroup = true;
      numberOfAttemptedImport++;

      promises.push(
        Groups.create({
          name: importingGroups[index].name,
          description: importingGroups[index].description,
          application_id: newAppId,
          parent_group: '',
        })
          .then(data => {
            groupIdMap.push({ staleId: item.id, newId: data.dataValues.id });
            emitUpdates(io, {
              step: `SUCCESS- importing ${data.dataValues?.name} `,
              status: 'success',
            });
            // return data;
          })
          .catch(err => {
            emitUpdates(io, {
              step: `ERR- importing ${data.dataValues?.name} `,
              status: 'error',
            });
            logger.error('<< err', err);
          })
      );
    }
  });

  // eslint-disable-next-line no-unused-vars
  Promise.all(promises).then(result => {
    emitUpdates(io, { step: 'Done importing root groups', status: 'normal' });
    emitUpdates(io, { step: 'Importing child groups', status: 'normal' });
    importChildGroups(
      newAppId,
      importingGroups,
      groupIdMap,
      numberOfAttemptedImport,
      assetData,
      io,
      res,
      app
    );
  });
}

//2 #### import child groups & assets
function importChildGroups(
  newAppId,
  importingGroups,
  groupIdMap,
  numberOfAttemptedImport,
  assetData,
  io,
  res,
  app
) {
  let importChildGroupsPromise = [];
  if (importingGroups.length !== numberOfAttemptedImport) {
    importingGroups.map((item, index) => {
      if (!item.doneImportingGroup) {
        let indexOfObject = groupIdMap.findIndex(
          element => element['staleId'] == item.parent_group
        );
        if (indexOfObject != -1) {
          item.doneImportingGroup = true;
          numberOfAttemptedImport++;
          importChildGroupsPromise.push(
            Groups.create({
              name: importingGroups[index].name,
              description: importingGroups[index].description,
              application_id: newAppId,
              parent_group: groupIdMap[indexOfObject].newId,
            })
              .then(data => {
                emitUpdates(io, {
                  step: `SUCCESS - importing ${data.dataValues?.name} `,
                  status: 'success',
                });
                groupIdMap.push({
                  staleId: item.id,
                  newId: data.dataValues.id,
                });
                return data;
              })
              .catch(err => {
                emitUpdates(io, {
                  step: `ERR - importing ${index.name} `,
                  status: 'success',
                });
                logger.error('ERR -', err);
              })
          );
        }
      }
    });
  }

  Promise.all(importChildGroupsPromise).then(result => {
    //Attempt to import all the groups if done importing - start importing assets
    if (numberOfAttemptedImport == importingGroups.length) {
      emitUpdates(io, { step: 'Done importing groups', status: 'normal' });
      emitUpdates(io, { step: 'Importing all assets', status: 'normal' });
      let importAllAssets = new Promise(function (resolve, reject) {
        resolve(importAssets(assetData, newAppId, groupIdMap, io));
      });
      importAllAssets
        .then(result => {
          Promise.all([allPromises]).then(result => {
            emitUpdates(io, {
              step: 'SUCCESS - Application import complete',
              status: 'success',
            });
            res.status(200).json({
              success: true,
              message: 'Import complete',
              appId: newAppId,
              app,
            });
          });
        })
        .catch(err => {
          logger.error(err);
        });
    } else {
      importChildGroups(
        newAppId,
        importingGroups,
        groupIdMap,
        numberOfAttemptedImport,
        assetData,
        io,
        res,
        app
      );
    }
  });
}

// Fuction maps through assets and use switch to import
function importAssets(assetData, newAppId, groupIdMap, io) {
  assetData.map(item => {
    switch (item[0]) {
      case 'files':
        return importAssetDetails(
          item,
          (assetType = File),
          newAppId,
          groupIdMap,
          io
        );

      case 'indexes':
        return importAssetDetails(
          item,
          (assetType = Index),
          newAppId,
          groupIdMap,
          io
        );

      case 'queries':
        return importAssetDetails(
          item,
          (assetType = Query),
          newAppId,
          groupIdMap,
          io
        );

      case 'jobs':
        return importAssetDetails(
          item,
          (assetType = Job),
          newAppId,
          groupIdMap,
          io
        );

      case 'dataflow':
        return importAssetDetails(
          item,
          (assetType = Dataflow),
          newAppId,
          groupIdMap,
          io
        );
    }
  });
}

// Function to import asset details, asset groups, asset_dataflows/ depend on jobs
function importAssetDetails(item, assetType, newAppId, groupIdMap, io) {
  item[1].map(asset => {
    let newAsset;
    asset.application_id = newAppId;
    allPromises.push(
      assetType
        .create(asset)
        .then(result => {
          newAsset = result;
          emitUpdates(io, {
            step: `SUCCESS - importing ${item[0]} ${asset.title} `,
            status: 'success',
          });
          //create asset Groups
          if (asset.groups?.length > 0) {
            asset.groups.map(assetGroupItem => {
              //Get new group id
              let newGroupId = groupIdMap.filter(
                item => item.staleId === assetGroupItem.id
              )[0].newId;
              AssetGroups.create({ assetId: result.id, groupId: newGroupId })
                .then(result => {
                  emitUpdates(io, {
                    step: `SUCCESS - creating asset group ${result.id} `,
                    status: 'success',
                  });
                })
                .catch(err => {
                  emitUpdates(io, {
                    step: 'ERR - creating asset group',
                    status: 'error',
                  });
                  logger.error('ERR -', err);
                });
            });
          }
        })
        .catch(error => {
          emitUpdates(io, {
            step: `ERR - importing ${item[0]} ${asset.title} `,
            status: 'err',
          });
          logger.error('Err creating asset', error);
        })
    );
  });
}

// #### Import Application Route
// TODO: CHECK THIS ROUTE
router.post(
  '/importApp',
  [
    body('user_id')
      .optional({ checkFalsy: true })
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid user_id'),
    body('title')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid title'),
    body('description').optional({ checkFalsy: true }),
    body('creator')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid creator'),
  ],
  upload.single('file'),
  async function (req, res) {
    // eslint-disable-next-line no-unused-vars
    const { filename, originalname, mimetype } = req.file;
    const sanitizedFileName = sanitize(filename);

    if (mimetype !== 'application/json') {
      removeFile(`tempFiles/${sanitizedFileName}`);
      emitUpdates(io, {
        step: 'ERR - Invalid file name or type',
        status: 'error',
      });
      return res
        .status(500)
        .json({ success: false, message: 'Invalid file name or format' });
    }

    fs.readFile(`tempFiles/${sanitizedFileName}`, async (err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error occured while importing application',
        });
      }

      emitUpdates(io, { step: 'Extracting data', status: 'normal' });
      let parsedData = validateJSON(data, `tempFiles/${sanitizedFileName}`);

      if (parsedData === 'error') {
        emitUpdates(io, { step: 'ERR - extracting data', status: 'error' });
        return res.status(404).send({
          success: false,
          message: 'Unable to read file uploaded. Data must be in JSON format',
        });
      }

      emitUpdates(io, {
        step: 'SUCCESS - extracting data',
        status: 'success',
      });
      emitUpdates(io, {
        step: 'Validating application data',
        status: 'normal',
      });

      if (parsedData.application) {
        emitUpdates(io, {
          step: 'SUCCESS -  Validating application data',
          status: 'success',
        });
        const { application } = parsedData;
        try {
          emitUpdates(io, {
            step: 'Checking if application name is unique',
            status: 'normal',
          });

          const applications = await Application.findAll({
            where: {
              creator: req.body.user,
              title: application.title,
            },
            order: [['updatedAt', 'DESC']],
            include: [UserApplication],
          });

          const matchedApp = applications.filter(
            app => app.title === application.title
          );
          if (matchedApp.length > 0) {
            emitUpdates(io, {
              step: `FAILED - App ${application.title} already exists `,
              status: 'error',
            });
            return res.status(409).json({
              success: false,
              message: `Application with title ${application.title} already exists `,
            });
          }

          emitUpdates(io, {
            step: 'SUCCESS -  Unique application name',
            status: 'success',
          });

          emitUpdates(io, {
            step: 'Validating user ',
            status: 'normal',
          });
          let newAppId;
          if (req.body.user) {
            emitUpdates(io, {
              step: 'SUCCESS - Validating user credentials',
              status: 'success',
            });
            emitUpdates(io, {
              step: 'Creating application',
              status: 'normal',
            });

            // Creating App
            try {
              const application = await Application.create({
                title: application.title,
                description: application.description,
                creator: req.body.user,
              });

              newAppId = application.id;
              emitUpdates(io, {
                step: 'SUCCESS - Creating application',
                status: 'success',
              });

              // Importing groups to newly created App
              let importingGroups = parsedData.application.groups;
              emitUpdates(io, {
                step: 'Parsing group data',
                status: 'normal',
              });
              const assetData = Object.entries(parsedData.application.assets);
              emitUpdates(io, {
                step: 'Done parsing group data',
                status: 'normal',
              });

              let groupIdMap = [];
              let numberOfAttemptedImport = 0;
              const app = {
                newAppId,
                appTitle: application.title,
              };
              importRootGroups(
                newAppId,
                importingGroups,
                groupIdMap,
                numberOfAttemptedImport,
                assetData,
                io,
                res,
                app
              );

              return res.status(200).json({
                success: true,
                message: 'Application created successfully',
              });
            } catch (err) {
              logger.error(err);
              emitUpdates(io, {
                step: 'ERR- Creating application',
                status: 'error',
              });
              return res.status(400).json({
                success: false,
                message: 'Unable to create application',
              });
            }
          } else {
            emitUpdates(io, {
              step: 'ERR- validating permission',
              status: 'error',
            });
            return res.status(400).json({
              success: false,
              message: 'Inadquate permission',
            });
          }
        } catch (err) {
          logger.error('err', err);
          return res.status(500).json({
            success: false,
            message: 'Error occured while getting application list',
          });
        }
      } else {
        //File uploaded does not have app ID
        emitUpdates(io, 'ERR -  Validating application data');
        return res.status(404).send({
          success: false,
          message: 'Unable to read file uploaded. Data must be in JSON format',
        });
      }
    });
  }
);

router.post(
  '/export',
  [body('id').isUUID(4).withMessage('Invalid application id')],
  (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

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

        let groups = await Groups.findAll({
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
              model: Groups,
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
              model: Groups,
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
              model: Groups,
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
              model: Groups,
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
                .send('Error occured while exporting application');
            res.download(exportFile, function (err) {
              if (err) {
                logger.error(err);
                logger.error('Error occurred during download...');
                return res
                  .status(500)
                  .send('Error occured while exporting application');
              } else {
                logger.verbose('Download completed....');
                fs.unlink(exportFile, err => {
                  if (err)
                    return res
                      .status(500)
                      .send('Error occured while exporting application');
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
      return res.status(500).json({
        success: false,
        message: 'Error occured while removing application',
      });
    }
  }
);

module.exports = router;
