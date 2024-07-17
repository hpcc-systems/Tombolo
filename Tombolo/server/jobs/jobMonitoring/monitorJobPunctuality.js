const { WorkunitsService } = require("@hpcc-js/comms");
const logger = require("../../config/logger");
const { decryptString } = require("../../utils/cipher");
const {
  calculateRunOrCompleteByTimes,
  generateJobName,
  createNotificationPayload,
  getProductCategory,
  getDomain,
  generateNotificationId,
} = require("./monitorJobsUtil");
const models = require("../../models");

const JobMonitoring = models.jobMonitoring;
const Cluster = models.cluster;
const NotificationQueue = models.notification_queue;
const monitoringTypeName = "Job Monitoring";
const MonitoringTypes = models.monitoring_types;


(async () => {
  const now = new Date(); // UTC time
  
  try {
    // Get all job monitorings
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

        const { schedule, expectedStartTime, expectedCompletionTime } =
          metaData;
        const clusterInfo = clustersObj[clusterId];

        // Calculate the run window for the job
        const window = calculateRunOrCompleteByTimes({
          schedule,
          timezone_offset: clusterInfo.timezone_offset,
          expectedStartTime,
          expectedCompletionTime,
        });


        // If the window is not today, continue
        if (!window) {
          continue;
        }

        const timePassed = window.start < window.currentTime;

        // If the time has not passed, continue
        if (!timePassed) {
          continue;
        }

        // If time passed, get the number of minutes passed
        const minutesPassed = Math.floor(
          (window.currentTime - window.start) / 60000
        );
        if (minutesPassed < 10) {
          continue;
        }

        // Check if notification has been sent out for this job, for the current window
        const jobPunctualityDetails = lastJobRunDetails?.jobPunctualityDetails;
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

          // Update the job monitoring
          await JobMonitoring.update(
            {
              lastJobRunDetails: {
                ...lastJobRunDetails,
                jobPunctualityDetails: {
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
      }
    }
  } catch (error) {
    logger.error(
      `Error in job punctuality monitoring script: ${error.message}`
    );
  }
})();