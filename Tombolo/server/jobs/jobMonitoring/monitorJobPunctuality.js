// Import from libraries
const { WorkunitsService } = require('@hpcc-js/comms');
const { parentPort } = require('worker_threads');
const _ = require('lodash');

// Local imports
const { decryptString } = require('../../utils/cipher');
const {
  calculateRunOrCompleteByTimes,
  generateJobName,
  createNotificationPayload,
  getProductCategory,
  getDomain,
  generateNotificationId,
  differenceInMs,
  nocAlertDescription,
} = require('./monitorJobsUtil');
const {
  JobMonitoring,
  Cluster,
  NotificationQueue,
  MonitoringType,
} = require('../../models');
const { getClusterOptions } = require('../../utils/getClusterOptions');
const { APPROVAL_STATUS } = require('../../config/constants');

const monitoringTypeName = 'Job Monitoring';

(async () => {
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Job Punctuality Monitoring: Monitoring started',
    });
  const now = new Date(); // UTC time

  try {
    // Find all active job monitorings.
    const jobMonitorings = await JobMonitoring.findAll({
      where: { isActive: 1, approvalStatus: APPROVAL_STATUS.APPROVED },
      raw: true,
    });

    // if no job monitorings are found - return
    if (jobMonitorings.length < 1) {
      return;
    }

    // Log info saying how many job monitorings are being processed
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: `Job Punctuality Monitoring: Processing  ${jobMonitorings.length} job monitoring(s)`,
      });

    // Get all unique clusters for the job monitorings
    const clusterIds = jobMonitorings.map(
      jobMonitoring => jobMonitoring.clusterId
    );

    // All clusters that are associated with the job monitorings
    const clusters = await Cluster.findAll({
      where: { id: clusterIds },
      // exclude storageUsageHistory
      attributes: {
        exclude: ['storageUsageHistory'],
      },
      raw: true,
    });

    // Decrypt cluster passwords if they exist
    clusters.forEach(clusterInfo => {
      try {
        if (clusterInfo.hash) {
          clusterInfo.password = decryptString(clusterInfo.hash);
        } else {
          clusterInfo.password = null;
        }
      } catch (error) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Job Punctuality Monitoring: Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`,
          });
      }
    });

    // Arrange clusters as object with id as key
    const clustersObj = clusters.reduce((acc, cluster) => {
      acc[cluster.id] = cluster;
      return acc;
    }, {});

    // Get monitoring type ID for "Job Monitoring"
    const monitoringTypeDetails = await MonitoringType.findOne({
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
        if (!notificationCondition.includes('NotStarted')) {
          continue;
        }

        const { schedule, expectedStartTime, expectedCompletionTime } =
          metaData;
        const clusterInfo = clustersObj[clusterId];

        if (!clusterInfo) {
          parentPort &&
            parentPort.postMessage({
              level: 'error',
              text: `Job Punctuality Monitoring: No cluster found for clusterId ${clusterId} in jobMonitoring ${id}`,
            });
          continue;
        }

        // Find severity level (For ASR ) - based on that determine when to send out notifications
        let severityThreshHold = 0; // Domain specific severity threshold for ASR
        let severeEmailRecipients = null;

        if (asrSpecificMetaData && asrSpecificMetaData.domain) {
          try {
            const { domain: domainId } = asrSpecificMetaData;
            const domain = await getDomain(domainId);
            if (domain) {
              severityThreshHold = domain.severityThreshold;
              severeEmailRecipients = domain.severityAlertRecipients;
            }
          } catch (error) {
            parentPort &&
              parentPort.postMessage({
                level: 'error',
                text: `Job Punctuality Monitoring : Error while getting Domain level severity : ${error.message}`,
              });
          }
        }

        // Job level severity threshold
        const jobLevelSeverity = asrSpecificMetaData?.severity || 0;

        // Back date in minutes need to be calculated so run window is correctly calculated . EX - for overnight jobs
        let backDateInMs = 0;
        let runWindowForJob = null;
        if (schedule[0]?.runWindow) {
          runWindowForJob = schedule[0].runWindow;
        }

        // Calculate the back date in ms
        if (runWindowForJob === 'overnight') {
          backDateInMs = differenceInMs({
            startTime: expectedStartTime,
            endTime: expectedCompletionTime,
            daysDifference: 1,
          });
        } else {
          backDateInMs = 0;
        }

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

        alertTimePassed = window.start < window.currentTime;

        lateByInMinutes = Math.floor(
          (window.currentTime - window.start) / 60000
        );

        // If the time has not passed, or with in grace period of 10 minutes, continue
        if (!alertTimePassed || lateByInMinutes < 10) {
          continue;
        }

        // Check if notification has been sent out for this job, for the current window
        const jobPunctualityDetails = lastJobRunDetails?.jobPunctualityDetails;

        let notificationAlreadySentForThisWindow = false;

        if (jobPunctualityDetails) {
          const { windowStartTime, windowEndTime } = jobPunctualityDetails;

          if (
            windowStartTime === window.start.toISOString() &&
            windowEndTime === window.end.toISOString()
          ) {
            notificationAlreadySentForThisWindow = true;
          }
        }

        // If notification has already been sent for this window for this JM- continue
        if (notificationAlreadySentForThisWindow) {
          continue;
        }

        // Make a call to HPCC to see if the job has started
        const translatedJobName = generateJobName({
          pattern: jobNamePattern,
          timezone_offset: clusterInfo.timezone_offset,
        });

        // Create a new instance of WorkunitsService
        const wuService = new WorkunitsService(
          getClusterOptions(
            {
              baseUrl: `${clusterInfo.thor_host}:${clusterInfo.thor_port}/`,
              userID: clusterInfo.username || '',
              password: clusterInfo.password || '',
            },
            clusterInfo.allowSelfSigned
          )
        );

        // Query HPCC for the workunits
        const {
          Workunits: { ECLWorkunit },
        } = await wuService.WUQuery({
          StartDate: window.start,
          EndDate: window.end,
          Jobname: translatedJobName,
        });

        // If a job is overnight, it could potentially have 2 translatedJobName as it can run on 2 different days
        if (schedule[0]?.runWindow === 'overnight') {
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
        let notificationPrefix = 'JM';
        let prodName;
        let domain;
        let domainRegion;
        let severity;
        const offSet = clusterInfo?.timezone_offset || 0;

        if (asrSpecificMetaData && asrSpecificMetaData.productCategory) {
          const { name: productName, shortCode } = await getProductCategory(
            asrSpecificMetaData.productCategory
          );

          notificationPrefix = shortCode;
          prodName = productName;

          const { name: domainName, region } = await getDomain(
            asrSpecificMetaData.domain
          );
          domain = domainName;
          domainRegion = region;

          severity = asrSpecificMetaData.severity;
        }

        // If no workunits are found, send out notifications
        if (ECLWorkunit.length === 0) {
          // Log which job did not start on time
          parentPort &&
            parentPort.postMessage({
              level: 'info',
              text: `Job Punctuality Monitoring:  ( ${monitoringName} ) is unpunctual. Expected start time: ${window.start.toLocaleString()}`,
            });

          // Notification payload
          const notificationPayload = createNotificationPayload({
            type: 'email',
            notificationDescription: `Monitoring ( ${monitoringName} ) detected that a monitored job  did not started on time`,
            templateName: 'jobMonitoring',
            originationId: monitoringTypeDetails.id,
            applicationId: applicationId,
            subject: `Job Monitoring Alert from ${process.env.INSTANCE_NAME} : Job not started on expected time`,
            recipients: {
              primaryContacts,
              secondaryContacts,
              notifyContacts,
            },
            jobName: jobNamePattern,
            wuState: null,
            monitoringName,
            issue: {
              Issue: 'Job not started on expected time',
              Cluster: clusterInfo.name,
              'Job Name/Filter': jobNamePattern,
              'Expected Start': window.start.toLocaleString(),
              'Current Time': window.currentTime.toLocaleString(),
            },
            notificationId: generateNotificationId({
              notificationPrefix,
              timezoneOffset: offSet || 0,
            }),
            asrSpecificMetaData: {
              region: domainRegion,
              product: prodName,
              domain,
              severity,
            }, // region: "USA",  product: "Telematics",  domain: "Insurance", severity: 3,
            firstLogged: new Date(
              now.getTime() + offSet * 60 * 1000
            ).toLocaleString(),
            lastLogged: new Date(
              now.getTime() + offSet * 60 * 1000
            ).toLocaleString(),
          });

          // Queue email notification
          await NotificationQueue.create(notificationPayload);
          parentPort &&
            parentPort.postMessage({
              level: 'verbose',
              text: `Job Punctuality Monitoring: Notification queued for ${monitoringName},  job not started on time`,
            });

          // NOC email notification
          if (jobLevelSeverity >= severityThreshHold && severeEmailRecipients) {
            const notificationPayloadForNoc = _.cloneDeep(notificationPayload);
            notificationPayloadForNoc.metaData.notificationDescription =
              nocAlertDescription;
            notificationPayloadForNoc.metaData.mainRecipients =
              severeEmailRecipients;
            notificationPayloadForNoc.metaData.notificationId =
              generateNotificationId({
                notificationPrefix,
                timezoneOffset: offSet || 0,
              });
            delete notificationPayloadForNoc.metaData.cc;
            await NotificationQueue.create(notificationPayloadForNoc);
            parentPort &&
              parentPort.postMessage({
                level: 'verbose',
                text: `Job Punctuality Monitoring: NOC Notification queued for ${monitoringName},  job not started on time`,
              });
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
          parentPort &&
            parentPort.postMessage({
              level: 'verbose',
              text: `Job Punctuality Monitoring: Last run details updated for ${monitoringName}`,
            });
        }
      } catch (error) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Job Punctuality Monitoring: Error while processing jobs for  punctuality check ${jobMonitoring.id}: ${error.message}`,
          });
      }
    }
  } catch (error) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `Job Punctuality Monitoring: Error in job punctuality monitoring script: ${error.message}`,
      });
  } finally {
    if (parentPort) {
      parentPort.postMessage({
        level: 'info',
        text: `Job Punctuality Monitoring: monitoring completed in ${(
          new Date().getTime() - now.getTime()
        ).toLocaleString()} ms`,
      });
    } else process.exit(0);
  }
})();
