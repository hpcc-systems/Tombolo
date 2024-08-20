const { WorkunitsService } = require("@hpcc-js/comms");
const logger = require("../../config/logger");
const { decryptString } = require("../../utils/cipher");
const { parentPort } = require("worker_threads");
const {
  calculateRunOrCompleteByTimes,
  generateJobName,
  createNotificationPayload,
  getProductCategory,
  getDomain,
  generateNotificationId,
  differenceInMs,
  nocAlertDescription,
} = require("./monitorJobsUtil");
const models = require("../../models");

const JobMonitoring = models.jobMonitoring;
const Cluster = models.cluster;
const NotificationQueue = models.notification_queue;
const monitoringTypeName = "Job Monitoring";
const MonitoringTypes = models.monitoring_types;
const IntegrationMapping = models.integration_mapping;
const Integrations = models.integrations;


(async () => {
  const now = new Date(); // UTC time
  
  try {
    // Find all active job monitorings.
    const jobMonitorings = await JobMonitoring.findAll({
      where: { isActive: 1, approvalStatus: "Approved" },
      raw: true,
    });

    // if no job monitorings are found - return
    if (jobMonitorings.length < 1) {
      return;
    }

    // All clusters
    const clusters = await Cluster.findAll({ raw: true });

    // Decrypt cluster passwords if they exist
    clusters.forEach((clusterInfo) => {
      try {
        if (clusterInfo.hash) {
          clusterInfo.password = decryptString(clusterInfo.hash);
        } else {
          clusterInfo.password = null;
        }
      } catch (error) {
        logger.error(
          `Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`
        );
      }
    });

    // Arrange clusters as object with id as key
    const clustersObj = clusters.reduce((acc, cluster) => {
      acc[cluster.id] = cluster;
      return acc;
    }, {});

    // Get monitoring type ID for "Job Monitoring"
    const monitoringTypeDetails = await MonitoringTypes.findOne({
      where: { name: monitoringTypeName },
      raw: true,
    });

    // Iterate over the job monitorings
    for (let jobMonitoring of jobMonitorings) {
      try {
        const {
          id,
          applicationId,
          monitoringName,
          jobName: jobNamePattern,
          metaData,
          clusterId,
          lastJobRunDetails,
        } = jobMonitoring;
        const {
          notificationMetaData: {
            notificationCondition = [],
            notifyContacts = [],
            primaryContacts = [],
            secondaryContacts = [],
          },
          asrSpecificMetaData,
        } = metaData;

        // If monitoring does not care about job punctuality, continue
        if (!notificationCondition.includes("NotStarted")) {
          continue;
        }

        const { schedule, expectedStartTime, expectedCompletionTime } =metaData;
        const clusterInfo = clustersObj[clusterId];

         // Find severity level (For ASR ) - based on that determine when to send out notifications
        let severityThreshHold = 0;
        let severeEmailRecipients = null;

        if(metaData.asrSpecificMetaData){
          try{
          const {id : integrationId} = await Integrations.findOne({where: {name: "ASR"}, raw: true});
          
          if(integrationId){
            // Get integration mapping with integration details
            const integrationMapping = await IntegrationMapping.findOne({
              where: {
                integration_id: integrationId,
                application_id: applicationId,
              },
              raw: true,
            });

            if(integrationMapping){
              const {
                metaData: {
                  nocAlerts: { severityLevelForNocAlerts, emailContacts },
                },
              } = integrationMapping;
              severityThreshHold = severityLevelForNocAlerts;
              severeEmailRecipients = emailContacts;
            }
            }
          }catch(error){
            logger.error(`Job Punctuality Monitoring : Error while getting integration level severity threshold: ${error.message}`);
          }
        }


        // Job level severity threshold
        const jobLevelSeverity = asrSpecificMetaData?.severity || 0;

        // console.log('---------- SEVERITY ----------------------');
        // console.log(jobLevelSeverity, severityThreshHold)
        // console.log('------------------------------------------');
      

        // If job level severity is less than the threshold, check only after the completion time
        let backDateInMs = 0;
        if ( jobLevelSeverity < severityThreshHold) {
          let runWindowForJob = null;
          if (schedule[0]?.runWindow) {
            runWindowForJob = schedule[0].runWindow;
          }

          // Calculate the back date in ms
          if (runWindowForJob === "overnight") {
            backDateInMs = differenceInMs({
              startTime: expectedCompletionTime,
              endTime: expectedStartTime,
              daysDifference: 1,
            });
          } else {
            backDateInMs = differenceInMs({
              startTime: expectedCompletionTime,
              endTime: expectedStartTime,
              daysDifference: 0,
            });
          }
        }

        console.log("-------------------------------------->")

        // Calculate the run window for the job
        const window = calculateRunOrCompleteByTimes({
          schedule,
          timezone_offset: clusterInfo.timezone_offset,
          expectedStartTime,
          expectedCompletionTime,
          backDateInMs,
        });

        // If the window null - continue. Job is not expected to run 
        if (!window) {
          continue;
        }

        let alertTimePassed = false;
        let lateByInMinutes = 0; 
        if(jobLevelSeverity < severityThreshHold){
          alertTimePassed = window.end < window.currentTime;
          lateByInMinutes = Math.floor((window.currentTime - window.end) / 60000);
        }else{
          alertTimePassed = window.start < window.currentTime;
          lateByInMinutes = Math.floor((window.currentTime - window.start) / 60000);
        }

        // Give grace period of 10 minutes
        if(lateByInMinutes >10){
          timePassed = true;
        }
        
        // If the time has not passed, continue
        if (!alertTimePassed) {
          continue;
        }

        // Check if notification has been sent out for this job, for the current window
        const jobPunctualityDetails = lastJobRunDetails?.jobPunctualityDetails;

        console.log("------", lastJobRunDetails);
        if (jobPunctualityDetails) {
          const { windowStartTime, windowEndTime } = jobPunctualityDetails;
          if (
            windowStartTime === window.start.toISOString() &&
            windowEndTime === window.end.toISOString()
          ) {
            continue;
          }
        }


        // Make a call to HPCC to see if the job has started
        const translatedJobName = generateJobName({
          pattern: jobNamePattern,
          timezone_offset: clusterInfo.timezone_offset,
        });

        // Create a new instance of WorkunitsService
        const wuService = new WorkunitsService({
          baseUrl: `${clusterInfo.thor_host}:${clusterInfo.thor_port}/`,
          userID: clusterInfo.username || "",
          password: clusterInfo.password || "",
        });

        // Query HPCC for the workunits
        const {
          Workunits: { ECLWorkunit },
        } = await wuService.WUQuery({
          StartDate: window.start,
          EndDate: window.end,
          Jobname: translatedJobName,
        });

        // If a job is overnight, it could potentially have 2 translatedJobName as it can run on 2 different days
        if(schedule[0]?.runWindow === 'overnight'){
          const translatedJobNameNextDay = generateJobName({
            pattern: jobNamePattern,
            timezone_offset: clusterInfo.timezone_offset,
            backDateInDays: 1,
          });

          const {
            Workunits: { ECLWorkunit: ECLWorkunitNextDay },
          } = await wuService.WUQuery({
            StartDate: window.start,
            EndDate: window.end,
            Jobname: translatedJobNameNextDay,
          });

          ECLWorkunit.push(...ECLWorkunitNextDay);
        }

        // If workunits are found, update the job monitoring and continue
        if (ECLWorkunit.length > 0) {
          await JobMonitoring.update(
            {
              lastJobRunDetails: {
                ...lastJobRunDetails,
                jobPunctualityDetails: {
                  wus: ECLWorkunit,
                  punctual: true,
                  windowStartTime: window.start,
                  windowEndTime: window.end,
                  discoveredAt: window.currentTime,
                },
              },
            },
            { where: { id } }
          );
          continue;
        }

        // Notification ID prefix
        let notificationPrefix = "JM";
        let prodName;
        let domain;
        let severity;
        const offSet = clusterInfo?.timezone_offset || 0;

        if (asrSpecificMetaData && asrSpecificMetaData.productCategory) {
          const { name: productName, shortCode } = await getProductCategory(
            asrSpecificMetaData.productCategory
          );

          notificationPrefix = shortCode;
          prodName = productName;

          const { name: domainName } = await getDomain(
            asrSpecificMetaData.domain
          );
          domain = domainName;

          severity = asrSpecificMetaData.severity;
        }

        // If no workunits are found, send out notifications
        if (ECLWorkunit.length === 0) {
          // Notification payload
          const notificationPayload = createNotificationPayload({
            type: "email",
            notificationDescription:
              "Monitoring detected that a monitored job has not started on time",
            templateName: "jobMonitoring",
            originationId: monitoringTypeDetails.id,
            applicationId: applicationId,
            subject: `Job Monitoring Alert: Job not started on expected time`,
            recipients: {
              primaryContacts,
              secondaryContacts,
              notifyContacts,
            },
            jobName: jobNamePattern,
            wuState: null,
            monitoringName,
            issue: {
              Issue: `Job not started on expected time`,
              Cluster: clusterInfo.name,
              "Job Name/Filter": jobNamePattern,
              "Expected Start": window.start,
              "Current Time": window.currentTime,
            },
            notificationId: generateNotificationId({
              notificationPrefix,
              timezoneOffset: offSet || 0,
            }),
            asrSpecificMetaData: {
              region: "USA",
              product: prodName,
              domain,
              severity,
            }, // region: "USA",  product: "Telematics",  domain: "Insurance", severity: 3,
            firstLogged: new Date(now.getTime() + offSet * 60 * 1000).toISOString(),
            lastLogged: new Date(now.getTime() + offSet * 60 * 1000).toISOString(),
          });

          // Queue email notification
          await NotificationQueue.create(notificationPayload);

          // NOC email notification
          if (jobLevelSeverity >= severityThreshHold && severeEmailRecipients) {
            const notificationPayloadForNoc = { ...notificationPayload };
            notificationPayloadForNoc.metaData.notificationDescription = nocAlertDescription;  
            notificationPayloadForNoc.metaData.mainRecipients = severeEmailRecipients;
            notificationPayloadForNoc.metaData.notificationId =
              generateNotificationId({
                notificationPrefix,
                timezoneOffset: offSet || 0,
              });
            delete notificationPayloadForNoc.metaData.cc;
            await NotificationQueue.create(notificationPayloadForNoc);
          }
          // Update the job monitoring
          await JobMonitoring.update(
            {
              lastJobRunDetails: {
                ...lastJobRunDetails,
                jobPunctualityDetails: {
                  wus: [],
                  punctual: false,
                  notified: true,
                  windowStartTime: window.start,
                  windowEndTime: window.end,
                  discoveredAt: window.currentTime,
                },
              },
            },
            { where: { id } }
          );
        }
      } catch (error) {
        logger.error(
          `Error while processing jobs for  punctuality check ${jobMonitoring.id}: ${error.message}`
        );
      }finally{
         if (parentPort) parentPort.postMessage("done");
         else process.exit(0);
      }
    }
  } catch (error) {
    logger.error(`Error in job punctuality monitoring script: ${error.message}`);
  }
})();