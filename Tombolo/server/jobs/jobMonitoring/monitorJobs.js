const monitoring_name = "Job Monitoring";
const { parentPort } = require("worker_threads");
const { WorkunitsService } = require("@hpcc-js/comms");

const logger = require("../../config/logger");
const models = require("../../models");
const { decryptString } = require("../../utils/cipher");
const {
  matchJobName,
  wuStartTimeWhenLastScanAvailable,
  wuStartTimeWhenLastScanUnavailable,
  createNotificationPayload,
  intermediateStates,
  generateNotificationId,
  getProductCategory,
  getDomain,
  findLocalDateTimeAtCluster,
  nocAlertDescription,
} = require("./monitorJobsUtil");
const e = require("express");

const JobMonitoring = models.jobMonitoring;
const cluster = models.cluster;
const MonitoringTypes = models.monitoring_types;
const MonitoringLogs = models.monitoring_logs;
const NotificationQueue = models.notification_queue;
const IntegrationMapping = models.integration_mapping;
const Integrations = models.integrations;

(async () => {
  const now = new Date(); // UTC time

  try {
    // Get monitoring type ID for "Job Monitoring"
    const { id } = await MonitoringTypes.findOne({
      where: { name: monitoring_name },
      raw: true,
    });
    if (!id) {
      throw new Error(`Monitoring type ${monitoring_name} not found.`);
    }
    const monitoringTypeId = id;

    // Find all active job monitorings.
    const jobMonitorings = await JobMonitoring.findAll({
      where: { isActive: 1, approvalStatus: "Approved" },
      raw: true,
    });

    /* if no job monitorings are found - return */
    if (jobMonitorings.length < 1) {
      logger.debug("No active job monitorings found.");
      return;
    }

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
        `Job Monitoring : Error while getting integration level severity threshold: ${error.message}`
      );
    }

    /* Organize job monitoring based on cluster ID. This approach simplifies interaction with 
    the HPCC cluster and minimizes the number of necessary API calls. */
    const jobMonitoringsByCluster = {};
    jobMonitorings.forEach((jobMonitoring) => {
      const clusterId = jobMonitoring.clusterId;

      if (!clusterId) {
        logger.error("Job monitoring missing cluster ID. Skipping...");
        return;
      }

      if (!jobMonitoringsByCluster[clusterId]) {
        jobMonitoringsByCluster[clusterId] = [jobMonitoring];
      } else {
        jobMonitoringsByCluster[clusterId].push(jobMonitoring);
      }
    });

    // Create array of unique cluster IDs
    const clusterIds = Object.keys(jobMonitoringsByCluster);

    // Get cluster info for all unique clusters
    const clustersInfo = await cluster.findAll({
      where: { id: clusterIds },
      raw: true,
    });
    const clusterInfoObj = {}; // For easy access later

    // Decrypt cluster passwords if they exist
    clustersInfo.forEach((clusterInfo) => {
      try {
        clusterInfoObj[clusterInfo.id] = clusterInfo;
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

    // Get the last time the cluster was scanned for job monitoring purposes
    const lastClusterScanDetails = await MonitoringLogs.findAll({
      where: { monitoring_type_id: monitoringTypeId, cluster_id: clusterIds },
      raw: true,
    });

    // Cluster  last scan info (Scan logs)
    clustersInfo.forEach((clusterInfo) => {
      const lastScanDetails = lastClusterScanDetails.find(
        (scanDetails) => scanDetails.cluster_id === clusterInfo.id
      );

      if (lastScanDetails) {
        clusterInfo.startTime = wuStartTimeWhenLastScanAvailable(
          lastScanDetails.scan_time,
          clusterInfo.timezone_offset
        );
      } else {
        clusterInfo.startTime = wuStartTimeWhenLastScanUnavailable(
          now,
          clusterInfo.timezone_offset,
          30
        );
      }
    });

    /* Fetch basic information for all work units per cluster */
    const wuBasicInfoByCluster = {};
    const failedToReachClusters = [];
    for (let clusterInfo of clustersInfo) {
      try {
        const wuService = new WorkunitsService({
          baseUrl: `${clusterInfo.thor_host}:${clusterInfo.thor_port}/`,
          userID: clusterInfo.username || "",
          password: clusterInfo.password || "",
        });

        // Date to string
        const startTime = clusterInfo.startTime.toISOString();

        let {
          Workunits: { ECLWorkunit },
        } = await wuService.WUQuery({ StartDate: startTime });
        const wuWithClusterIds = ECLWorkunit.map((wu) => {
          return { ...wu, clusterId: clusterInfo.id };
        });

        wuBasicInfoByCluster[clusterInfo.id] = [...wuWithClusterIds];
      } catch (err) {
        failedToReachClusters.push(clusterInfo.id);
        logger.error(`Job monitoring - Error while reaching out to cluster ${clusterInfo.id} : ${err}`);
      }
    }

    // If no new workunits are found for any clusters, exit
    let newWorkUnitsFound = false;
    for (let keys in wuBasicInfoByCluster) {
      if (wuBasicInfoByCluster[keys].length > 0) {
        newWorkUnitsFound = true;
      } else {
        delete wuBasicInfoByCluster[keys];
      }
    }

    // If no new monitoring work units are found, update the monitoring logs and exit
    if (!newWorkUnitsFound) {
      // If failed to reach cluster, do not update last monitored time in monitoring logs
      const scanned_clusters = clusterIds.filter(
        (id) => !failedToReachClusters.includes(id)
      );

      for (let id of scanned_clusters) {
        // grab existing metaData
        const log = await MonitoringLogs.findOne({
          where: { monitoring_type_id: monitoringTypeId, cluster_id: id },
          raw: true,
        });

        // Existing intermediate state jobs
        let existingIntermediateStateJobs = [];
        let existingMetaData = {};

        if (log) {
          existingMetaData = log.metaData || {};
          existingIntermediateStateJobs =
            existingMetaData?.wuInIntermediateState || [];
        }

        try {
          const x = await MonitoringLogs.upsert(
            {
              cluster_id: id,
              monitoring_type_id: monitoringTypeId,
              scan_time: now,
              metaData: {
                ...existingMetaData,
                wuInIntermediateState: existingIntermediateStateJobs,
              },
            },
            {
              returning: true, // This option ensures the method returns the updated or created entry
              conflictTarget: ["cluster_id", "monitoring_type_id"], // Specify the fields to check for conflicts
            }
          );
        } catch (err) {
          logger.error(
            `Job monitoring - Error while updating last cluster scanned time stamp`
          );
        }
      }
      logger.verbose(
        "Job Monitoring - No new work units found for any clusters"
      );
      return;
    }
    // Clusters with new work units - Done to minimize the number of calls to db later
    const clusterIdsWithNewWUs = Object.keys(wuBasicInfoByCluster);

    const jmWithNewWUs = {};
    let lowerCaseNotificationCondition = [];
    const jobMonitoringObj = {}; // For easy access late

    for (let monitoring of jobMonitorings) {
      jobMonitoringObj[monitoring.id] = monitoring;
      const {
        monitoringName,
        clusterId,
        jobName: jobNameOrPattern,
        id,
        metaData,
      } = monitoring;
      const {
        notificationMetaData: { notificationCondition = [] },
      } = metaData;
      lowerCaseNotificationCondition = notificationCondition.map((condition) =>
        condition.toLowerCase()
      );

      // If cluster has no new workunits, skip - reduces computation
      if (!clusterIdsWithNewWUs.includes(clusterId)) {
        continue;
      }

      try {
        const cluster = clustersInfo.find(
          (cluster) => cluster.id === clusterId
        );

        let clusterWUs = wuBasicInfoByCluster[clusterId];

        const matchedWus = clusterWUs.filter((wu) => {
          return matchJobName({
            jobNameFormat: jobNameOrPattern,
            jobName: wu.Jobname,
            timezone_offset: cluster.timezone_offset,
          });
        });

        jmWithNewWUs[id] = matchedWus;
      } catch (err) {
        logger.error(
          `Job monitoring. Looping job monitorings ${monitoringName}. id:  ${id}. ERR -  ${err.message}`
        );
      }
    }

    //Wus in failed state failed, aborted, unknown
    const failedStateJobs = [];
    const intermediateStateJobs = [];
    // Check if any jobs are in undesired state
    for (let jmId in jmWithNewWUs) {
      // Iterating over an object
      const wus = jmWithNewWUs[jmId];
      for (let wu of wus) {
        // Separate failed state jobs
        if (lowerCaseNotificationCondition.includes(wu.State.toLowerCase())) {
          failedStateJobs.push({ ...wu, jmId });
          continue;
        }

        // Separate intermediate state jobs
        if (intermediateStates.includes(wu.State.toLowerCase())) {
          intermediateStateJobs.push({
            ...wu,
            jobMonitoringData: jobMonitoringObj[jmId],
          });
          continue;
        }
      }
    }

    // Create notifications for failed state jobs
    for (let failedJob of failedStateJobs) {
      const { jmId, ...wu } = failedJob;
      const jobMonitoring = jobMonitoringObj[jmId];
      const {
        monitoringName,
        jobName,
        clusterId,
        metaData: {
          asrSpecificMetaData,
          notificationMetaData: {
            notifyContacts = [],
            primaryContacts = [],
            secondaryContacts = [],
          },
        },
      } = jobMonitoring;

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

      //Notification payload
      const notificationPayload = createNotificationPayload({
        type: "email",
        notificationDescription: `Monitoring detected that a monitored job is in ${wu.State} state`,
        templateName: "jobMonitoring",
        originationId: monitoringTypeId,
        applicationId: jobMonitoring.applicationId,
        subject: `Job Monitoring Alert: Job in ${wu.State} state`,
        recipients: { primaryContacts, secondaryContacts, notifyContacts },
        jobName: jobName,
        wuState: wu.State,
        monitoringName,
        issue: {
          Issue: `Job in ${wu.State} state`,
          Cluster: clusterInfoObj[clusterId].name || "",
          "Job Name/Filter": jobName,
          "Returned Job": wu.Jobname,
          "Discovered at": findLocalDateTimeAtCluster(
            clusterInfoObj[clusterId].timezone_offset
          ),
          State: wu.State,
        },
        notificationId: generateNotificationId({
          notificationPrefix,
          timezoneOffset: clusterInfoObj[clusterId].timezone_offset || 0,
        }),
        asrSpecificMetaData: {
          region: "USA",
          product,
          domain,
          severity,
        }, // region: "USA",  product: "Telematics",  domain: "Insurance", severity: 3,
        firstLogged: findLocalDateTimeAtCluster(
          clusterInfoObj[clusterId].timezone_offset
        ),
        lastLogged: findLocalDateTimeAtCluster(
          clusterInfoObj[clusterId].timezone_offset
        ),
      });

      //Create notification queue
      await NotificationQueue.create(notificationPayload);

      // If severity is above threshold, send out NOC notification
      if (severity >= severityThreshHold && severeEmailRecipients) {
        const notificationPayloadForNoc = { ...notificationPayload };
        notificationPayloadForNoc.metaData.notificationDescription = nocAlertDescription;
        notificationPayloadForNoc.metaData.mainRecipients = severeEmailRecipients;
        notificationPayload.metaData.notificationId = generateNotificationId({
          notificationPrefix,
          timezoneOffset: clusterInfoObj[clusterId].timezone_offset || 0,
        }),
        delete notificationPayloadForNoc.metaData.cc;
        await NotificationQueue.create(notificationPayloadForNoc);
      }
    }

    // If failed to reach cluster, do not update last monitored time in monitoring logs
    const scannedClusters = clusterIds.filter(
      (id) => !failedToReachClusters.includes(id)
    );

    // Update monitoring logs
    for (let id of scannedClusters) {
      try {
        //Get existing metadata
        const log = await MonitoringLogs.findOne({
          where: { monitoring_type_id: monitoringTypeId, cluster_id: id },
          raw: true,
        });

        if (!log) {
          continue;
        }

        // Filter intermediate state jobs for the cluster
        const intermediateStateJobsForCluster = intermediateStateJobs.filter(
          (job) => job.clusterId === id
        );

        let existingIntermediateStateJobs = [];
        let existingMetaData = {};

        existingMetaData = log.metaData || {};
        existingIntermediateStateJobs =
          existingMetaData?.wuInIntermediateState || [];

        // Update or create monitoring logs
        await MonitoringLogs.upsert({
          cluster_id: id,
          monitoring_type_id: monitoringTypeId,
          scan_time: now,
          metaData: {
            ...existingMetaData,
            wuInIntermediateState: [
              ...existingIntermediateStateJobs,
              ...intermediateStateJobsForCluster,
            ],
          },
          returning: true,
          conflictTarget: ["cluster_id", "monitoring_type_id"],
        });
      } catch (err) {
        logger.error(
          `Job monitoring - Error while updating last cluster scanned time stamp`,
          err
        );
      }
    }

  } catch (err) {
    logger.error(err);
  } finally {
    if (parentPort) parentPort.postMessage("done");
    else process.exit(0);
  }
})();