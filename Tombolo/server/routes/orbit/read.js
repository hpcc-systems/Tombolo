const {
  OrbitBuild,
  OrbitMonitoring,
  MonitoringNotification,
} = require('../../models');
const express = require('express');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require('../../utils/response');
const {
  validateCreateOrbit,
  validateGetOrbitsByAppId,
  validateSearchByKeyword,
  validateGetOrbitBuild,
  validateUpdateOrbitMonitor,
  validateToggleStatus,
  validateDeleteOrbit,
  validateGetOrbitById,
  validateGetWorkunits,
  validateUpdateList,
  validateGetDomains,
  validateGetProducts,
} = require('../../middlewares/orbitMiddleware');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
const notificationTemplate = require('../../jobs/messageCards/notificationTemplate');
// const { notify } = require('../notifications/email-notification');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const SqlString = require('sqlstring');

const jobScheduler = require('../../jobSchedular/job-scheduler.js');

const {
  runMySQLQuery,
  runSQLQuery,
  orbitDbConfig,
  fidoDbConfig,
} = require('../../utils/runSQLQueries.js');

const logger = require('../../config/logger.js');

require('dotenv').config({ path: ENVPath });

//create one monitoring
//TODO get workunits from past 2 weeks as well in orbitbuilds table
router.post('/', validate(validateCreateOrbit), async (req, res) => {
  try {
    // get last status and WU to store against future checks
    const query = `select HpccWorkUnit as 'WorkUnit', Name as 'Build', DateUpdated as 'Date', Status_Code as 'Status' from DimBuildInstance where Name = ${SqlString.escape(
      req.body.build
    )} order by Date desc LIMIT 1`;

    const wuResult = await runMySQLQuery(query, orbitDbConfig);

    if (wuResult?.err) {
      throw Error(result.message);
    }

    //destructure out of recordset and place inside of new metaData
    const { WorkUnit, Date, Status } = wuResult[0][0];

    const metaData = req.body.metaData;

    metaData.lastWorkUnit = {
      lastWorkUnit: WorkUnit,
      lastWorkUnitDate: Date,
      lastWorkUnitStatus: Status,
    };

    //null out isActive in metaData to reduce noise
    metaData.isActive = null;

    // TODO transform data before sending in for easier updates
    let newBuildData = {
      application_id: req.body.application_id,
      cron: req.body.cron,
      name: req.body.name,
      build: req.body.build,
      severityCode: req.body.severityCode,
      product: req.body.product,
      businessUnit: req.body.businessUnit,
      host: req.body.host,
      primaryContact: req.body.primaryContact,
      secondaryContact: req.body.secondaryContact,
      metaData: metaData,
      isActive: req.body.isActive,
    };

    const newOrbitMonitoring = await OrbitMonitoring.create(newBuildData);

    const { isActive } = req.body;

    //Add monitoring to bree if start monitoring now is checked
    if (isActive) {
      const schedularOptions = {
        orbitMonitoring_id: newOrbitMonitoring.dataValues.id,
        cron: newOrbitMonitoring.cron,
      };

      jobScheduler.createOrbitMonitoringJob(schedularOptions);
    }

    return sendSuccess(
      res,
      newOrbitMonitoring,
      'Orbit monitoring created successfully',
      201
    );
  } catch (error) {
    logger.error('orbit/read create: ', error);
    return sendError(res, 'Unable to save Orbit monitoring details', 500);
  }
});

//get all monitorings
router.get(
  '/allMonitorings/:application_id',
  validate(validateGetOrbitsByAppId),
  async (req, res) => {
    try {
      const { application_id } = req.params;

      const result = await OrbitMonitoring.findAll({
        where: {
          application_id,
        },
      });

      return sendSuccess(
        res,
        result,
        'Orbit monitorings retrieved successfully'
      );
    } catch (err) {
      logger.error('getOrbitMonitorings: ', err);
      return sendError(res, err.message, 500);
      // ... error checks
    }
  }
);

//get all
router.get(
  '/allMonitoring/:application_id',
  validate(validateGetOrbitsByAppId),
  async (req, res) => {
    try {
      const { application_id } = req.params;
      if (!application_id) throw Error('Invalid app ID');
      const result = await OrbitMonitoring.findAll({
        where: {
          application_id,
        },
      });

      return sendSuccess(
        res,
        result,
        'Orbit monitorings retrieved successfully'
      );
    } catch (err) {
      logger.error('getOrbitMonitorings: ', err);
      return sendError(res, err.message, 500);
    }
  }
);

//search Database for builds with keyword
router.get(
  '/search/:application_id/:keyword',
  validate(validateSearchByKeyword),
  async (req, res) => {
    try {
      const { application_id, keyword } = req.params;
      if (!application_id) throw Error('Invalid app ID');

      const keywordEscaped = SqlString.escape('%' + keyword + '%');

      const query = `select Name from DimBuildInstance where Name like ${keywordEscaped} and Name not like 'Scrub%' and EnvironmentName = 'Insurance' order by  Name asc`;

      const result = await runMySQLQuery(query, orbitDbConfig);

      if (result.err) {
        throw Error(result.message);
      }

      const uniqueNames = [];

      const unique = result[0].filter(element => {
        const isDuplicate = uniqueNames.includes(element.Name);

        if (!isDuplicate) {
          uniqueNames.push(element.Name);

          return true;
        }

        return false;
      });

      return sendSuccess(res, unique, 'Builds found successfully');
    } catch (err) {
      // ... error checks
      logger.error('orbit/read keywordSearch: ', err);
      return sendError(
        res,
        'There was an issue contacting the orbit reports server',
        400
      );
    }
  }
);

/* get single build */
router.get(
  '/getOrbitBuildDetails/:buildName',
  validate(validateGetOrbitBuild),
  async (req, res) => {
    try {
      const { buildName } = req.params;

      //connect to db

      const query = `select EnvironmentName, Name, Status_DateCreated, HpccWorkUnit, Status_Code, Substatus_Code, BuildInstanceIdKey  from DimBuildInstance where Name = ${SqlString.escape(
        buildName
      )} order by Status_DateCreated desc LIMIT 1`;

      const result = await runMySQLQuery(query, orbitDbConfig);

      if (result.err) {
        throw Error(result.err);
      }

      return sendSuccess(
        res,
        result[0][0],
        'Build details retrieved successfully'
      );
    } catch (err) {
      // ... error checks
      logger.error('getOrbitBuildDetails: ', err);
      return sendError(
        res,
        'There was an issue contacting the orbit reports server',
        400
      );
    }
  }
);

//update orbit monitoring
router.put('/', validate(validateUpdateOrbitMonitor), async (req, res) => {
  try {
    const oldInfo = await OrbitMonitoring.findOne({
      where: { id: req.body.id },
      raw: true,
    });

    let newInfo = req.body;

    //destructure info out of sent info
    const {
      id,
      name,
      build,
      notifyCondition,
      severityCode,
      product,
      businessUnit,
      host,
      isActive,
      application_id,
      primaryContact,
      secondaryContact,
      cron,
      metaData: { lastMonitored, monitoringCondition },
    } = newInfo;

    //CODEQL FIX
    //-----------------------
    let notificationChannels = req.body.notificationChannels;

    if (!(notificationChannels instanceof Array)) {
      return [];
    }
    //-----------------------

    //build out notifications object for storing inside metadata
    let emails, msTeamsGroups;
    if (notificationChannels.includes('eMail')) {
      emails = newInfo.emails;
    }
    if (notificationChannels.includes('msTeams')) {
      msTeamsGroups = newInfo.msTeamsGroups;
    }

    let notifications = [];

    for (let i = 0; i < notificationChannels.length; i++) {
      if (notificationChannels[i] === 'eMail') {
        notifications.push({ channel: 'eMail', recipients: emails });
      }
      if (notificationChannels[i] === 'msTeams') {
        notifications.push({
          channel: 'msTeams',
          recipients: msTeamsGroups,
        });
      }
    }
    const escapedBuild = SqlString.escape(build);

    //get most recent work unit for storage
    // get last status and WU to store against future checks
    const query = `select  HpccWorkUnit as 'WorkUnit', Name as 'Build', DateUpdated as 'Date', Status_Code as 'Status' from DimBuildInstance where Name = ${escapedBuild}
       order by Date desc LIMIT 1`;

    const wuResult = await runMySQLQuery(query, orbitDbConfig);

    if (wuResult.err) {
      throw Error(result.message);
    }

    //destructure out of recordset and place inside of new metaData
    const { WorkUnit, Date, Status } = wuResult[0][0];

    //set data fields
    newInfo = {
      id,
      name,
      cron,
      isActive,
      build,
      severityCode,
      product,
      businessUnit,
      application_id,
      host,
      primaryContact,
      secondaryContact,
      metaData: {
        lastWorkUnit: {
          lastWorkUnit: WorkUnit,
          lastWorkUnitDate: Date,
          lastWorkUnitStatus: Status,
        },
        lastMonitored,
        notifications,
        severityCode,
        monitoringCondition,
      },
    };
    // -------------------------------------------------------

    await OrbitMonitoring.update(newInfo, { where: { id } });

    // If start monitoring was changed to TRUE
    if (isActive && oldInfo.isActive === 0) {
      const schedularOptions = {
        orbitMonitoring_id: id,
        cron: newOrbitMonitoring.cron,
      };

      jobScheduler.createOrbitMonitoringJob(schedularOptions);
    }

    // If start monitoring was changed to FALSE
    if (!isActive && oldInfo.isActive === 1) {
      await jobScheduler.removeJobFromScheduler(`Orbit Monitoring - ${id}`);
    }

    // if cron has changed
    if (oldInfo.cron != cron) {
      const allBreeJobs = jobScheduler.getAllJobs();
      const jobName = `Orbit Monitoring - ${id}`;
      for (let job of allBreeJobs) {
        if (job.name === jobName) {
          await jobScheduler.removeJobFromScheduler(jobName);
          await jobScheduler.createOrbitMonitoringJob({
            orbitMonitoring_id: id,

            cron: cron,
          });
        }
      }
    }

    return sendSuccess(res, newInfo, 'Orbit monitoring updated successfully');
  } catch (error) {
    logger.error('orbit/read update: ', error);
    return sendError(res, 'Unable to save orbit build monitoring details', 500);
  }
});

// EVERYTHING ABOVE THIS WORKS WITH APP ID VALIDATION

// Pause or start monitoring
router.put(
  '/togglestatus/:id',
  validate(validateToggleStatus),
  async (req, res) => {
    try {
      const { id } = req.params;
      const monitoring = await OrbitMonitoring.findOne({
        where: { id },
        raw: true,
      });
      const { isActive } = monitoring;

      // flipping isActive
      await OrbitMonitoring.update(
        { isActive: !isActive },
        { where: { id: id } }
      );

      // If isActive, it is in bre - remove from bree
      if (isActive) {
        await jobScheduler.removeJobFromScheduler(`Orbit Monitoring - ${id}`);
      }

      // const name = monitoring.name;
      const cron = monitoring.cron;

      // If isActive = false, add it to bre
      if (!isActive) {
        await jobScheduler.createOrbitMonitoringJob({
          orbitMonitoring_id: id,
          cron: cron,
        });
      }

      return sendSuccess(
        res,
        { message: 'Update successful' },
        'Status toggled successfully'
      );
    } catch (err) {
      logger.error('orbit/read toggleStatus: ', err);
      return sendError(res, 'Failed to toggle status', 500);
    }
  }
);

//delete
router.delete(
  '/delete/:id/:name',
  validate(validateDeleteOrbit),
  async (req, res) => {
    try {
      // eslint-disable-next-line no-unused-vars
      const { id, name } = req.params;
      const response = await OrbitMonitoring.destroy({
        where: { id },
      });

      //Check if this job is in bree - if so - remove
      const breeJobs = jobScheduler.getAllJobs();
      const expectedJobName = `Orbit Monitoring - ${id}`;
      if (breeJobs?.length) {
        for (job of breeJobs) {
          if (job.name === expectedJobName) {
            jobScheduler.removeJobFromScheduler(expectedJobName);
            break;
          }
        }
      }

      return sendSuccess(
        res,
        { message: `Deleted ${response} orbit monitoring` },
        'Orbit monitoring deleted successfully'
      );
    } catch (err) {
      logger.error('orbit/read delete: ', err);
      return sendError(res, err.message, 500);
    }
  }
);

router.get(
  '/getOne/:application_id/:id',
  validate(validateGetOrbitById),
  async (req, res) => {
    try {
      const { id, application_id } = req.params;

      const result = await OrbitMonitoring.findOne({
        where: { id, application_id },
        raw: true,
      });

      return sendSuccess(
        res,
        result,
        'Orbit monitoring retrieved successfully'
      );
    } catch (err) {
      logger.error('orbit/read getOne: ', err);
      return sendError(res, err.message, 500);
    }
  }
);

router.get(
  '/getWorkunits/:application_id',
  validate(validateGetWorkunits),
  async (req, res) => {
    try {
      const { application_id } = req.params;

      const result = await OrbitMonitoring.findAll({
        where: { application_id },
        raw: true,
      });

      //connect to db

      let wuList = [];
      if (result?.length) {
        await Promise.all(
          result.map(async build => {
            let wu = await OrbitBuild.findAll({
              where: { application_id, name: build.build },
              raw: true,
            });

            if (wu.length > 0) {
              wu.map(wu => {
                wuList.push(wu);
              });
            }

            Promise.resolve;
          })
        );
      }

      return sendSuccess(res, wuList, 'Workunits retrieved successfully');
    } catch (err) {
      logger.error('orbit/read getWorkunits: ', err);
      return sendError(res, err.message, 500);
    }
  }
);

//refresh data, grab new builds
router.post(
  '/updateList/:application_id',
  validate(validateUpdateList),
  async (req, res) => {
    try {
      const { application_id } = req.params;
      if (!application_id) throw Error('Invalid app ID');

      const query =
        // eslint-disable-next-line quotes
        "select * from DimBuildInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc LIMIT 10";

      const result = runMySQLQuery(query, orbitDbConfig);

      const sentNotifications = [];
      //just grab the rows from result
      let rows = result[0];

      if (rows?.length) {
        //loop through rows to build notifications and import
        await Promise.all(
          rows?.map(async build => {
            //check if the build already exists
            let orbitBuild = await OrbitBuild.findOne({
              where: {
                build_id: build.BuildInstanceIdKey,
                application_id: application_id,
              },
              raw: true,
            });

            //if it doesn't exist, create it and send a notification
            if (!orbitBuild) {
              //create build
              const newBuild = await OrbitBuild.create({
                application_id: application_id,
                build_id: build.BuildInstanceIdKey,
                name: build.Name,
                metaData: {
                  lastRun: build.DateUpdated,
                  status: build.Status_Code,
                  subStatus: build.SubStatus_Code,
                  workunit: build.HpccWorkUnit,
                  EnvironmentName: build.EnvironmentName,
                  Template: build.BuildTemplate_Name,
                },
              });

              //if megaphone, send notification
              // if (build.SubStatus_Code === "MEGAPHONE")

              //build and send email notification
              if (integration.metaData.notificationEmails) {
                let buildDetails = {
                  name: newBuild.name,
                  status: newBuild.metaData.status,
                  subStatus: newBuild.metaData.subStatus,
                  lastRun: newBuild.metaData.lastRun,
                  workunit: newBuild.metaData.workunit,
                };

                const emailBody =
                  notificationTemplate.orbitBuildEmailBody(buildDetails);
                const emailRecipients = integration.metaData.notificationEmails;

                // await notify({
                //   to: emailRecipients,
                //   from: process.env.EMAIL_SENDER,
                //   subject:
                //     'Alert: Megaphone Substatus detected on Orbit Build ' +
                //     build.Name,
                //   text: emailBody,
                //   html: emailBody,
                // });

                let notification_id = uuidv4();

                sentNotifications.push({
                  id: notification_id,
                  status: 'notified',
                  notifiedTo: emailRecipients,
                  notification_channel: 'eMail',
                  application_id,
                  notification_reason: 'Megaphone Substatus',
                  monitoring_id: newBuild.id,
                  monitoring_type: 'orbit',
                });
              }

              // //build and send Teams notification
              if (integration.metaData.notificationWebhooks) {
                let facts = [
                  { name: newBuild.name },
                  { status: newBuild.metaData.status },
                  { subStatus: newBuild.metaData.subStatus },
                  { lastRun: newBuild.metaData.lastRun },
                  { workunit: newBuild.metaData.workunit },
                ];
                let title = 'Orbit Build Detectd With Megaphone Status';
                notification_id = uuidv4();
                const cardBody = notificationTemplate.orbitBuildMessageCard(
                  title,
                  facts,
                  notification_id
                );
                await axios.post(
                  integration.metaData.notificationWebhooks,
                  cardBody
                );

                sentNotifications.push({
                  id: notification_id,
                  status: 'notified',
                  notifiedTo: emailRecipients,
                  notification_channel: 'msTeams',
                  application_id,
                  notification_reason: 'Megaphone Substatus',
                  monitoring_id: newBuild.id,
                  monitoring_type: 'orbit',
                });
              }
            }

            return true;
          })
        );
      }

      // Record notifications
      if (sentNotifications.length > 0) {
        await MonitoringNotification.bulkCreate(sentNotifications);
      }

      return sendSuccess(res, result, 'List updated successfully');
    } catch (err) {
      logger.error('orbit/read updateList: ', err);
      return sendError(
        res,
        'There was an issue contacting the orbit reports server',
        400
      );
    }
  }
);

router.get(
  '/getDomains/:application_id',
  validate(validateGetDomains),
  async (req, res) => {
    try {
      const query =
        // eslint-disable-next-line quotes
        "select business_unit from pbi.dim_asr_domain_v where business_unit != 'Unassigned' AND business_unit != 'Not Applicable' order by business_unit asc";
      const result = await runSQLQuery(query, fidoDbConfig);

      if (result?.recordset) {
        return sendSuccess(
          res,
          result.recordset,
          'Domains retrieved successfully'
        );
      }

      throw Error('No domains found on Fido Server: ' + query);
    } catch (err) {
      logger.error('orbit/read getDomains: ', err);
      return sendError(
        res,
        'There was an issue contacting the orbit reports server',
        400
      );
    }
  }
);

router.get(
  '/getProducts/:application_id',
  validate(validateGetProducts),
  async (req, res) => {
    try {
      const query =
        'select product_name from pbi.dim_asr_product_v order by product_name asc';
      const result = await runSQLQuery(query, fidoDbConfig);

      if (result?.recordset) {
        return sendSuccess(
          res,
          result.recordset,
          'Products retrieved successfully'
        );
      }

      throw Error('No products found on Fido Server: ' + query);
    } catch (err) {
      logger.error('orbit/read getProducts: ', err);
      return sendError(
        res,
        'There was an issue contacting the orbit reports server',
        400
      );
    }
  }
);

module.exports = router;
