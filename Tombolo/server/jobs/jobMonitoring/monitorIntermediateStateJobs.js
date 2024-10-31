const MONITORING_NAME = "Job Monitoring";
const { parentPort } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");
const _ = require("lodash");

// Local imports
const logger = require("../../config/logger");
const models = require("../../models");
const { decryptString } = require("../../utils/cipher");

const {
  findLocalDateTimeAtCluster,
  checkIfCurrentTimeIsWithinRunWindow,
  intermediateStates,
  generateNotificationId,
  getProductCategory,
  getDomain,
  createNotificationPayload,
  nocAlertDescription,
} = require("./monitorJobsUtil");

// Constants
const cluster = models.cluster;
const notification_queue = models.notification_queue;
const monitoring_types = models.monitoring_types;
const monitoring_logs = models.monitoring_logs;

(async () => {
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
      (log) =>
        log.metaData &&
        log.metaData.wuInIntermediateState &&
        log.metaData.wuInIntermediateState.length > 0
    );

    // list of unique cluster IDs
    const clusterIds = [
      ...new Set(
        monitoringsWithIntermediateStateWus.map((log) => log.cluster_id)
      ),
    ];

    // Get cluster info for all unique clusters
    const clustersInfo = await cluster.findAll({
      where: { id: clusterIds },
      raw: true,
    });

    // Decrypt cluster passwords if they exist
    clustersInfo.forEach((clusterInfo) => {
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
        logger.error(
          `Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`
        );
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
      },[]);

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
              applicationId,
              jobName,
              jobMonitoringData: {
                monitoringName,
                metaData: {
                  notificationMetaData,
                  asrSpecificMetaData,
                  requireComplete,
                  expectedStartTime,
                  expectedCompletionTime,
                },
              },
            } = wuData;

            // create a new instance of WorkunitsService
            const wuService = new WorkunitsService({
              baseUrl: `${clusterDetail.thor_host}:${clusterDetail.thor_port}/`,
              userID: clusterDetail.username || "",
              password: clusterDetail.password || "",
            });

            // Make call to HPCC to get the state of the WU
            let newWuDetails = null;
            try{
              newWuDetails = (await wuService.WUInfo({ Wuid: wuData.Wuid })).Workunit;
            }catch(err){
              logger.error(`Intermediate JM : Error getting WU details for ${wuData.Wuid} on cluster ${clusterDetail.id}: ${err.message}`);
              continue;
            }
            
            const currentWuState = newWuDetails.State;
            const currentStateLowerCase = currentWuState.toLowerCase();

            // Notification condition in lower case
            const notificationConditionLowerCase =
              notificationMetaData.notificationCondition.map((condition) =>
                condition.toLowerCase()
              );

            let sendAlert = false;
            let keepWu = true;
            let notificationDescription;
            

            const currentTimeToWindowRelation =  checkIfCurrentTimeIsWithinRunWindow({
                   start: expectedStartTime,
                   end: expectedCompletionTime,
                   currentTime: findLocalDateTimeAtCluster(clusterDetail.timezone_offset || 0),
                 });
            // Check if the job is completed
            if (currentStateLowerCase === 'completed') {
              //TODO - There is a gap, if the job is completed but immediately  after the expected time, notification won't be sent, although users might want to know that the job was completed after the expected time
              keepWu = false;
            } else if (notificationConditionLowerCase.includes(currentStateLowerCase)) {
              // Check if the job state is included in the notification condition
              sendAlert = true;
              notificationDescription = `job is in  ${wuData.State} state.`;
              keepWu = false;
            } else if (intermediateStates.includes(currentStateLowerCase)) {
              // Check if the job state is in intermediate states
              if (!requireComplete) {
                keepWu = false;
              } else if (requireComplete && currentTimeToWindowRelation === 'within') {
                keepWu = true;
              } else if (requireComplete &&  currentTimeToWindowRelation === "after") {
                notificationDescription = `job in ${wuData.State} state and has not been completed by the expected time.`;
                sendAlert = true;
                keepWu = false;
              } else {
                logger.verbose(`Intermediate JM : ${wuData.Wuid} on cluster ${clusterDetail.id} is in intermediate state ${currentWuState} not covered by any condition`);
              }
            }

            // If monitoring to be kept, add to wuToKeepMonitoring
            if (keepWu) {
              wuToKeepMonitoring.push(wuData);
            }else {
              wuToStopMonitoring.push(wuData.Wuid);
            }

            // If alert to be sent, create notification payload
            if (sendAlert) {
              // Notification ID prefix
              let notificationPrefix = "JM";
              let product;
              let domain;
              let region;
              let domainLevelSeverity;
              let jobLevelSeverity;
              let severeEmailRecipients;

              if (asrSpecificMetaData && asrSpecificMetaData.productCategory) {
                const { name: productName, shortCode } =
                  await getProductCategory(asrSpecificMetaData.productCategory);

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
                type: "email",
                notificationDescription: `Analysis (${monitoringName}) detected that a  monitored ${notificationDescription}`,
                templateName: "jobMonitoring",
                originationId: monitoringTypeId,
                applicationId: applicationId,
                subject: `Job Monitoring Alert from ${process.env.INSTANCE_NAME} : Job not completed by expected time`,
                recipients: {
                  primaryContacts: notificationMetaData.primaryContacts || [],
                  secondaryContacts:
                    notificationMetaData.secondaryContacts || [],
                  notifyContacts: notificationMetaData.notifyContacts || [],
                },
                jobName: jobName,
                wuState: wuData.State,
                monitoringName,
                issue: {
                  Issue: _.startCase(notificationDescription),
                  Cluster: clusterDetail.name,
                  "Job Name/Filter": wuData.jobNamePattern,
                  "Returned Job": wuData.Jobname,
                  State: wuData.State,
                  "Discovered at": findLocalDateTimeAtCluster(
                    clusterDetail.timezone_offset
                  ),
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
                ),
                lastLogged: findLocalDateTimeAtCluster(
                  clusterDetail.timezone_offset
                ),
              });

              // Add notification payload to notificationsToBeQueued
              notificationsToBeQueued.push(notificationPayload);

              //  If job level severity is greater than or equal to  domain level severity, send alert to NOC
              if (jobLevelSeverity >= domainLevelSeverity && severeEmailRecipients) {
                    const notificationPayloadForNoc = _.cloneDeep(notificationPayload);
                    notificationPayloadForNoc.metaData.notificationDescription = nocAlertDescription;
                    notificationPayloadForNoc.metaData.mainRecipients =  severeEmailRecipients;
                    notificationPayloadForNoc.metaData.notificationId =  generateNotificationId({ notificationPrefix, timezoneOffset: clusterDetail.timezone_offset || 0}),
                    delete notificationPayloadForNoc.metaData.cc;
                    notificationsToBeQueued.push(notificationPayloadForNoc);
                }
            }
          } catch (err) {
              logger.error(`Monitoring Intermediate state jobs : ${err.message}`);
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
      logger.debug(
        "Intermediate state job Monitoring -  No WU to remove from intermediate state and no intermediate workunit with updated state Exiting..."
      );
      return;
    }

    //Remove wu that are not longer in intermediate state.
    for (let log of monitoringLogs) {
      try {
        const { id, metaData } = log;
        const { wuInIntermediateState = [] } = metaData;

        // Remove completed jobs
        let wuStillInIntermediateState = wuInIntermediateState.filter(
          (wu) => !wuToStopMonitoring.includes(wu.Wuid)
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
        logger.error(
          `Intermediate State Jobs - Error updating log with id ${log.id}:`,
          error
        );
      }
    }
  } catch (err) {
    logger.error(`Monitoring Intermediate state jobs : ${err.message}`);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();