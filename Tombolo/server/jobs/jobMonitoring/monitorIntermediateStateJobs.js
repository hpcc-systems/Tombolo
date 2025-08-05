const MONITORING_NAME = 'Job Monitoring';
const { parentPort } = require('worker_threads');
const { WorkunitsService } = require('@hpcc-js/comms');
const _ = require('lodash');

// Local imports
const {
  Cluster,
  notification_queue,
  monitoring_types,
  monitoring_logs,
  jobMonitoring_Data: JobMonitoringData,
} = require('../../models');
const { decryptString } = require('../../utils/cipher');

const {
  findLocalDateTimeAtCluster,
  checkIfCurrentTimeIsWithinRunWindow,
  intermediateStates,
  generateNotificationId,
  getProductCategory,
  getDomain,
  createNotificationPayload,
  nocAlertDescription,
  WUInfoOptions,
  inferWuStartTime,
} = require('./monitorJobsUtil');
const shallowCopyWithOutNested = require('../../utils/shallowCopyWithoutNested');
const { getClusterOptions } = require('../../utils/getClusterOptions');

(async () => {
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Intermediate state JM: Monitoring started ...',
    });
  const now = new Date(); // UTC time

  try {
    // Get monitoring type ID for "Job Monitoring"
    const monitoringType = await monitoring_types.findOne({
      where: { name: MONITORING_NAME },
      raw: true,
    });

    // if monitoring type is not found, log error and exit
    if (!monitoringType) {
      throw new Error(
        `Monitoring type ${MONITORING_NAME} not found. possible rename or delete`
      );
    }

    // Job monitoring ID
    const monitoringTypeId = monitoringType.id;

    // Get all monitoring logs with monitoring type ID ie - job monitoring
    const monitoringLogs = await monitoring_logs.findAll({
      where: { monitoring_type_id: monitoringTypeId },
      raw: true,
    });

    // Monitoring logs with intermediate state Wus -> metaData.wuInIntermediateState length is greater than 0
    const monitoringsWithIntermediateStateWus = monitoringLogs.filter(
      log =>
        log.metaData &&
        log.metaData.wuInIntermediateState &&
        log.metaData.wuInIntermediateState.length > 0
    );

    // list of unique cluster IDs
    const clusterIds = [
      ...new Set(
        monitoringsWithIntermediateStateWus.map(log => log.cluster_id)
      ),
    ];

    // Get cluster info for all unique clusters
    const clustersInfo = await Cluster.findAll({
      where: { id: clusterIds },
      raw: true,
    });

    // Decrypt cluster passwords if they exist
    clustersInfo.forEach(clusterInfo => {
      try {
        if (clusterInfo.hash) {
          clusterInfo.password = decryptString(clusterInfo.hash);
        } else {
          clusterInfo.password = null;
        }

        clusterInfo.localTime = findLocalDateTimeAtCluster(
          clusterInfo.timezone_offset || 0
        );
      } catch (error) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Intermediate State Job Monitoring: Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`,
          });
      }
    });

    // Cluster info as object with cluster ID as key
    const clustersInfoObj = clustersInfo.reduce((acc, cluster) => {
      acc[cluster.id] = cluster;
      return acc;
    }, {});

    // Combine all the intermediate wus in an array
    const allIntermediateWus = monitoringsWithIntermediateStateWus.reduce(
      (acc, log) => {
        const { metaData } = log;
        const { wuInIntermediateState = [] } = metaData;
        acc.push(...wuInIntermediateState);
        return acc;
      },
      []
    );

    const notificationsToBeQueued = [];
    const wuToStopMonitoring = [];
    const wuWithNewIntermediateState = {};
    const wuToKeepMonitoring = [];

    // Iterate through all the monitoring logs with intermediate state WUs
    for (wuData of allIntermediateWus) {
      try {
        const { clusterId } = wuData;
        const clusterDetail = clustersInfoObj[clusterId];
        const {
          Wuid,
          jobName,
          jobMonitoringData: {
            id: jobMonitoringId,
            applicationId,
            monitoringName,
            metaData: {
              notificationMetaData,
              asrSpecificMetaData,
              requireComplete,
              expectedStartTime,
              expectedCompletionTime,
              maxExecutionTime,
            },
          },
        } = wuData;

        // create a new instance of WorkunitsService
        const wuService = new WorkunitsService(
          getClusterOptions(
            {
              baseUrl: `${clusterDetail.thor_host}:${clusterDetail.thor_port}/`,
              userID: clusterDetail.username || '',
              password: clusterDetail.password || '',
            },
            clusterDetail.allowSelfSigned
          )
        );

        let sendAlert = false;
        let keepWu = true;
        let notificationDescription;

        // Make call to HPCC to get the state of the WU
        let newWuDetails = null;
        try {
          newWuDetails = (await wuService.WUInfo(WUInfoOptions(Wuid))).Workunit;
        } catch (err) {
          parentPort &&
            parentPort.postMessage({
              level: 'error',
              text: `Intermediate state JM : Error getting WU details for ${Wuid} on cluster ${clusterDetail.id}: ${err.message}`,
            });

          // If  err.message include Invalid Workunit ID", remove the WU from monitoring
          if (err.message.includes('Invalid Workunit ID')) {
            wuToStopMonitoring.push(Wuid);
            keepWu = false;
          }
          continue;
        }

        const currentWuState = newWuDetails.State;
        const currentStateLowerCase = currentWuState.toLowerCase();

        // Notification condition in lower case
        const notificationConditionLowerCase =
          notificationMetaData.notificationCondition.map(condition =>
            condition.toLowerCase()
          );

        const currentTimeToWindowRelation = checkIfCurrentTimeIsWithinRunWindow(
          {
            start: expectedStartTime,
            end: expectedCompletionTime,
            currentTime: findLocalDateTimeAtCluster(
              clusterDetail.timezone_offset || 0
            ),
          }
        );
        // Check if the job is completed
        if (currentStateLowerCase === 'completed') {
          if (notificationConditionLowerCase.includes('timeseriesanalysis')) {
            try {
              await JobMonitoringData.create({
                monitoringId: jobMonitoringId,
                applicationId,
                wuId: newWuDetails.Wuid,
                wuState: currentWuState,
                wuTopLevelInfo: shallowCopyWithOutNested(newWuDetails),
                wuDetailInfo: { ...newWuDetails },
                date: now,
                analyzed: false,
              });
            } catch (err) {
              parentPort &&
                parentPort.postMessage({
                  level: 'error',
                  text: `Monitoring Intermediate State Job: Error while trying to save wuInfo for ${err.message} : ${err.message}`,
                });
              continue;
            }
          }
          keepWu = false;
        } else if (
          notificationConditionLowerCase.includes(currentStateLowerCase)
        ) {
          // This captures failed, aborted and unknown
          // Check if the job state is included in the notification condition
          sendAlert = true;
          wuData.State = currentWuState;
          notificationDescription = `job is in  ${currentWuState} state.`;
          keepWu = false;

          // Store data
          try {
            await JobMonitoringData.create({
              monitoringId: jobMonitoringId,
              applicationId: applicationId,
              wuId: newWuDetails.Wuid,
              wuState: currentWuState,
              wuTopLevelInfo: shallowCopyWithOutNested(newWuDetails),
              wuDetailInfo: { ...newWuDetails },
              date: now,
              analyzed: false,
            });
          } catch (err) {
            parentPort &&
              parentPort.postMessage({
                level: 'error',
                text: `Monitoring Intermediate State Job: Error while trying to save wuInfo for ${err.message} : ${err.message}`,
              });
            continue;
          }
        } else if (intermediateStates.includes(currentStateLowerCase)) {
          // Running, compiling, etc

          // Check if the job is running too long
          if (notificationConditionLowerCase.includes('jobrunningtoolong')) {
            try {
              const wuStartTime = inferWuStartTime(Wuid);
              const currentTimeAtCluster = findLocalDateTimeAtCluster(
                clustersInfoObj[clusterId].timezone_offset
              );

              // time elapse since job started
              const timeElapsedSinceWuStarted = Math.round(
                (currentTimeAtCluster - wuStartTime) / 6000,
                3
              );
              const isJobRunningTooLong =
                timeElapsedSinceWuStarted > maxExecutionTime;

              if (isJobRunningTooLong) {
                notificationDescription = `Job is running longer than expected. Estimated completion time was ${maxExecutionTime} minutes, but it has been ${timeElapsedSinceWuStarted} minutes and is still in ${currentWuState} state.`;
                sendAlert = true;
                keepWu = true;
              }
            } catch (err) {
              parentPort &&
                parentPort.postMessage({
                  level: 'error',
                  text: `Intermediate job monitoring: Error while trying calculate if job ran too long ${wu.Wuid} : ${err.message}`,
                });
            }
          }

          // Check if the job state is in intermediate states0
          if (!requireComplete) {
            keepWu = false;
          } else if (
            (requireComplete && currentTimeToWindowRelation === 'within') ||
            !currentTimeToWindowRelation
          ) {
            keepWu = true;
          } else if (
            requireComplete &&
            currentTimeToWindowRelation === 'after'
          ) {
            notificationDescription = `job in ${wuData.State} state and has not been completed by the expected time.`;
            sendAlert = true;
            keepWu = false;
          } else {
            parentPort &&
              parentPort.postMessage({
                level: 'verbose',
                text: `Intermediate state JM : ${Wuid} on cluster ${clusterDetail.id} is in intermediate state ${currentWuState} not covered by any condition`,
              });
          }
        }

        // If monitoring to be kept, add to wuToKeepMonitoring
        if (keepWu) {
          wuToKeepMonitoring.push(wuData);
        } else {
          wuToStopMonitoring.push(Wuid);
        }

        // If alert to be sent, create notification payload
        if (sendAlert) {
          // Notification ID prefix
          let notificationPrefix = 'JM';
          let product;
          let domain;
          let region;
          let domainLevelSeverity;
          let jobLevelSeverity;
          let severeEmailRecipients;

          if (asrSpecificMetaData && asrSpecificMetaData.productCategory) {
            const { name: productName, shortCode } = await getProductCategory(
              asrSpecificMetaData.productCategory
            );

            notificationPrefix = shortCode;
            product = productName;

            const {
              name: domainName,
              region: domainRegion,
              severityThreshold,
              severityAlertRecipients,
            } = await getDomain(asrSpecificMetaData.domain);
            domain = domainName;
            region = domainRegion;
            domainLevelSeverity = severityThreshold;
            jobLevelSeverity = asrSpecificMetaData.severity;
            severeEmailRecipients = severityAlertRecipients;
          }

          // Generate notification payload
          const notificationPayload = createNotificationPayload({
            type: 'email',
            notificationDescription: `Analysis (${monitoringName}) detected that a  monitored ${notificationDescription}`,
            templateName: 'jobMonitoring',
            originationId: monitoringTypeId,
            applicationId: applicationId,
            subject: `Job Monitoring Alert from ${process.env.INSTANCE_NAME} : Job not completed by expected time`,
            recipients: {
              primaryContacts: notificationMetaData.primaryContacts || [],
              secondaryContacts: notificationMetaData.secondaryContacts || [],
              notifyContacts: notificationMetaData.notifyContacts || [],
            },
            jobName: jobName,
            wuState: wuData.State,
            wuId: Wuid,
            monitoringName,
            issue: {
              Issue: _.startCase(notificationDescription),
              Cluster: clusterDetail.name,
              'Job Name/Filter': wuData.jobNamePattern,
              'Returned Job': wuData.Jobname,
              State: wuData.State,
              'Discovered at': findLocalDateTimeAtCluster(
                clusterDetail.timezone_offset
              ).toLocaleString(),
              'Expected Start Time': expectedStartTime,
              'Expected Completion Time': expectedCompletionTime,
            },
            notificationId: generateNotificationId({
              notificationPrefix,
              timezoneOffset: clusterDetail.timezone_offset || 0,
            }),
            asrSpecificMetaData: {
              region,
              product,
              domain,
              severity: jobLevelSeverity,
            }, // region: "USA",  product: "Telematics",  domain: "Insurance", severity: 3,
            firstLogged: findLocalDateTimeAtCluster(
              clusterDetail.timezone_offset
            ).toLocaleString(),
            lastLogged: findLocalDateTimeAtCluster(
              clusterDetail.timezone_offset
            ).toLocaleString(),
          });

          // Add notification payload to notificationsToBeQueued
          notificationsToBeQueued.push(notificationPayload);

          //  If job level severity is greater than or equal to  domain level severity, send alert to NOC
          if (
            jobLevelSeverity >= domainLevelSeverity &&
            severeEmailRecipients
          ) {
            const notificationPayloadForNoc = _.cloneDeep(notificationPayload);
            notificationPayloadForNoc.metaData.notificationDescription =
              nocAlertDescription;
            notificationPayloadForNoc.metaData.mainRecipients =
              severeEmailRecipients;
            (notificationPayloadForNoc.metaData.notificationId =
              generateNotificationId({
                notificationPrefix,
                timezoneOffset: clusterDetail.timezone_offset || 0,
              })),
              delete notificationPayloadForNoc.metaData.cc;
            notificationsToBeQueued.push(notificationPayloadForNoc);
          }
        }
      } catch (err) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Intermediate State Job Monitoring: ${err.message}`,
          });
      }
    }

    // Insert notification in queue
    for (let notification of notificationsToBeQueued) {
      await notification_queue.create(notification);
    }

    // if wuToStopMonitoring is empty, or state of intermediate wu has not changed return
    if (
      wuToStopMonitoring.length === 0 &&
      Object.keys(wuWithNewIntermediateState).length === 0
    ) {
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: 'Intermediate state JM: No WU to remove or update. Exiting...',
        });
      return;
    }

    //Remove wu that are not longer in intermediate state.
    for (let log of monitoringLogs) {
      try {
        const { id, metaData } = log;
        const { wuInIntermediateState = [] } = metaData;

        // Remove completed jobs
        let wuStillInIntermediateState = wuInIntermediateState.filter(
          wu => !wuToStopMonitoring.includes(wu.Wuid)
        );

        // If state of intermediate WU has changed, update
        for (let wu of wuStillInIntermediateState) {
          if (wuWithNewIntermediateState[wu.Wuid]) {
            wu.State = wuWithNewIntermediateState[wu.Wuid];
          }
        }

        // copy existingMetadata and update wuInIntermediateState and update the monitoring log
        const existingMetadata = { ...metaData };
        existingMetadata.wuInIntermediateState = wuStillInIntermediateState;
        await monitoring_logs.update(
          { metaData: existingMetadata },
          { where: { id } }
        );
      } catch (error) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Intermediate state JM: Error updating log with id ${log.id}: ${error.message}`,
          });
      }
    }
  } catch (err) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `Intermediate state JM: ${err.message}`,
      });
  } finally {
    if (parentPort) {
      parentPort.postMessage({
        level: 'info',
        text: `Intermediate state JM: Job completed successfully in ${new Date() - now} ms`,
      });
    } else {
      process.exit(0);
    }
  }
})();
