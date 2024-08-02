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
const IntegrationMapping = models.integration_mapping;
const Integrations = models.integrations;

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

    // list of unique cluster IDs
    const clusterIds = [
      ...new Set(monitoringLogs.map((log) => log.cluster_id)),
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

    // Get array of monitoring logs which has the intermediate worUnits
    const monitoringsWithIntermediateStateWus = [];

    monitoringLogs.forEach((log) => {
      if (!log.metaData) return;
      const {
        metaData: { wuInIntermediateState },
      } = log;
      if (!wuInIntermediateState) return;
      monitoringsWithIntermediateStateWus.push(log);
    });

    // copy the array to avoid mutation
    const copyMonitoringsWithIntermediateStateWus = [
      ...monitoringsWithIntermediateStateWus,
    ];

    const notificationsToBeQueued = [];
    const wuNoLongerInIntermediateState = [];
    const wuWithNewIntermediateState = {};

    // Find severity level (For ASR ) - based on that determine when to send out notifications
    let severityThreshHold = 0;
    let severeEmailRecipients = null;
    try {
      const { id: integrationId } = await Integrations.findOne({
        where: { name: "ASR" },
        raw: true,
      });

      if (integrationId) {
        // Get integration mapping with integration details
        const integrationMapping = await IntegrationMapping.findOne({
          where: { integration_id: integrationId },
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
    } catch (error) {
      logger.error(
        `Intermediate State Job Monitoring : Error while getting integration level severity threshold: ${error.message}`
      );
    }

    for (let [
      monitoringIndex,
      monitoring,
    ] of monitoringsWithIntermediateStateWus.entries()) {
      const { cluster_id } = monitoring;
      const clusterDetail = clustersInfo.find(
        (cluster) => cluster.id === cluster_id
      );

      try {
        // create a new instance of WorkunitsService
        const wuService = new WorkunitsService({
          baseUrl: `${clusterDetail.thor_host}:${clusterDetail.thor_port}/`,
          userID: clusterDetail.username || "",
          password: clusterDetail.password || "",
        });

        const {
          metaData: { wuInIntermediateState },
        } = monitoring;

        // Iterate through all the intermediate state WUs
        for (let wu of wuInIntermediateState) {
          const {
            jobMonitoringData: {
              applicationId,
              monitoringName,
              clusterId,
              jobName: jobNamePattern,
              metaData: {
                notificationMetaData: {
                  notificationCondition,
                  primaryContacts = [],
                  secondaryContacts = [],
                  notifyContacts = [],
                },
                asrSpecificMetaData,
                requireComplete = [],
                expectedStartTime,
                expectedCompletionTime,
              },
            },
          } = wu;

          // Cluster details
          const clusterDetail = clustersInfo.find(
            (cluster) => cluster.id === clusterId
          );

          // Notification ID prefix
          let notificationPrefix = "JM";
          let product;
          let domain;
          let severity;

          if (asrSpecificMetaData && asrSpecificMetaData.productCategory) {
            // Product
            const { name: productName, shortCode } = await getProductCategory(
              asrSpecificMetaData.productCategory
            );
            notificationPrefix = shortCode;
            product = productName;

            //Domain
            const { name: domainName } = await getDomain(
              asrSpecificMetaData.domain
            );
            domain = domainName;

            //Severity
            severity = asrSpecificMetaData.severity;
          }

          // Notification condition in lower case. ex - failed, aborted, completed
          const notificationConditionLowerCase = notificationCondition.map(
            (condition) => condition.toLowerCase()
          );

          try {
            const info = await wuService.WUInfo({ Wuid: wu.Wuid });
            const {
              Workunit: { State },
            } = info;

            // Check if current time is before, after, within the window
            const currentTimeToWindowRelation =
              checkIfCurrentTimeIsWithinRunWindow({
                start: expectedStartTime,
                end: expectedCompletionTime,
                currentTime: clusterDetail.localTime,
              });
            
     
            const sendAlertToNoc = severity >= severityThreshHold && severeEmailRecipients;
            

            // WU now in state such as failed, aborted etc
            if (notificationConditionLowerCase.includes(State)) {
              // Add new State to the WU
              wu.State = _.capitalize(State);

              // notification object
              const notificationPayload = createNotificationPayload({
                type: "email",
                notificationDescription: `Analysis detected a monitored job in ${State} state`,
                templateName: "jobMonitoring",
                originationId: monitoringTypeId,
                applicationId: applicationId,
                subject: `Job Monitoring Alert: Job in ${State} state`,
                recipients: {
                  primaryContacts,
                  secondaryContacts,
                  notifyContacts,
                },
                jobName: jobNamePattern,
                wuState: wu.State,
                monitoringName,
                issue: {
                  Issue: `Job in ${wu.State} state`,
                  Cluster: clusterDetail.name,
                  "Job Name/Filter": jobNamePattern,
                  "Returned Job": wu.Jobname,
                  State: wu.State,
                  "Discovered at": findLocalDateTimeAtCluster(
                    clusterDetail.timezone_offset
                  ),
                },
                notificationId: generateNotificationId({
                  notificationPrefix,
                  timezoneOffset: clusterDetail.timezone_offset || 0,
                }),
                asrSpecificMetaData: {
                  region: "USA",
                  product,
                  domain,
                  severity,
                }, // region: "USA",  product: "Telematics",  domain: "Insurance", severity: 3,
                firstLogged: findLocalDateTimeAtCluster(
                  clusterDetail.timezone_offset
                ),
                lastLogged: findLocalDateTimeAtCluster(
                  clusterDetail.timezone_offset
                ),
              });

              notificationPayload.wuId = wu.Wuid;
              notificationsToBeQueued.push(notificationPayload);

              // NOC email notification if severity is high
              if (sendAlertToNoc) {
                notificationPayload.metaData.notificationDescription = nocAlertDescription;
                notificationPayload.metaData.mainRecipients = severeEmailRecipients;
                delete notificationPayload.metaData.cc;
                notificationsToBeQueued.push(notificationPayload);
              }

              wuNoLongerInIntermediateState.push(wu.Wuid);
            }
            // Still in intermediate state but window is passed an the job is required to be completed
            else if (
              intermediateStates.includes(State) &&
              currentTimeToWindowRelation === "after" &&
              requireComplete === true
            ) {

              // Add new State to the WU
              wu.State = _.capitalize(State);

              // notification object
              const notificationPayload = createNotificationPayload({
                type: "email",
                notificationDescription: `Analysis detected that a  monitored job has not completed by the expected time. The job is currently in the ${State} state.`,
                templateName: "jobMonitoring",
                originationId: monitoringTypeId,
                applicationId: applicationId,
                subject: `Job Monitoring Alert: Job not completed by expected time`,
                recipients: {
                  primaryContacts,
                  secondaryContacts,
                  notifyContacts,
                },
                jobName: jobNamePattern,
                wuState: wu.State,
                monitoringName,
                issue: {
                  Issue: `Job in ${wu.State} state`,
                  Cluster: clusterDetail.name,
                  "Job Name/Filter": jobNamePattern,
                  "Returned Job": wu.Jobname,
                  State: wu.State,
                  "Discovered at": findLocalDateTimeAtCluster(
                    clusterDetail.timezone_offset
                  ),
                },
                notificationId: generateNotificationId({
                  notificationPrefix,
                  timezoneOffset: clusterDetail.timezone_offset || 0,
                }),
                asrSpecificMetaData: {
                  region: "USA",
                  product,
                  domain,
                  severity,
                }, // region: "USA",  product: "Telematics",  domain: "Insurance", severity: 3,
                firstLogged: findLocalDateTimeAtCluster(
                  clusterDetail.timezone_offset
                ),
                lastLogged: findLocalDateTimeAtCluster(
                  clusterDetail.timezone_offset
                ),
              });
              notificationsToBeQueued.push(notificationPayload);

              // NOC email notification if severity is high
              if (sendAlertToNoc) {
                notificationPayload.metaData.notificationDescription = nocAlertDescription;
                notificationPayload.metaData.mainRecipients = severeEmailRecipients;
                delete notificationPayload.metaData.cc;
                notificationsToBeQueued.push(notificationPayload);
              }

              wuNoLongerInIntermediateState.push(wu.Wuid);
            }
            // IF the job is still in intermediate state and the current time is within the run  window
            else if (
              intermediateStates.includes(State) &&
              currentTimeToWindowRelation === "within"
            ) {

              // If the State has changed from last time it was checked, update monitoring needs to be updated with new state
              if (wu.State !== State) {
                wuWithNewIntermediateState[wu.Wuid] = State;
              }
            } else {
              // WU in completed state - Remove the WU from the intermediate state
              wuNoLongerInIntermediateState.push(wu.Wuid);
            }
          } catch (err) {
            logger.error(
              `Monitor Intermediate Jobs. WUId - ${wu.Wuid} - Cluster ${cluster_id}: ${err.message}`
            );
          }
        }
      } catch (err) {
        logger.error(err);
      }
    }

    // Insert notification in queue
    for (let notification of notificationsToBeQueued) {
      await notification_queue.create(notification);
    }

    // if wuNoLongerInIntermediateState is empty, or state of intermediate wu has not changed return
    if (
      wuNoLongerInIntermediateState.length === 0 &&
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
          (wu) => !wuNoLongerInIntermediateState.includes(wu.Wuid)
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
        logger.error(`Intermediate State Jobs - Error updating log with id ${log.id}:`, error);
      }
    }
  } catch (err) {
    logger.error(err);
  } finally {
    logger.debug(
      `Job monitoring completed started ${now} and ended at ${new Date()}`
    );
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();
