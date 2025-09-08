// Imports from libraries
const { parentPort } = require('worker_threads');
const { WorkunitsService } = require('@hpcc-js/comms');
const _ = require('lodash');

// Local imports
const {
  JobMonitoring,
  Cluster,
  MonitoringType,
  MonitoringLog,
  NotificationQueue,
  JobMonitoringData,
} = require('../../models');
const { decryptString } = require('../../utils/cipher');
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
  WUInfoOptions,
} = require('./monitorJobsUtil');
const shallowCopyWithOutNested = require('../../utils/shallowCopyWithoutNested');
const { getClusterOptions } = require('../../utils/getClusterOptions');

// Variables
const monitoring_name = 'Job Monitoring';

(async () => {
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Job Monitoring:  Monitoring started',
    });
  const now = new Date(); // UTC time

  try {
    // Get monitoring type ID for "Job Monitoring"
    const { id } = await MonitoringType.findOne({
      where: { name: monitoring_name },
      raw: true,
    });
    if (!id) {
      throw new Error(`Monitoring type ${monitoring_name} not found.`);
    }
    const monitoringTypeId = id;

    // Find all active job monitorings.
    const jobMonitorings = await JobMonitoring.findAll({
      where: { isActive: 1, approvalStatus: 'approved' },
      raw: true,
    });

    /* if no job monitorings are found - return */
    if (jobMonitorings.length < 1) {
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: 'Job Monitoring: No active job monitorings found.',
        });

      return;
    }

    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: `Job Monitoring: Found ${jobMonitorings.length} active job monitorings.`,
      });

    /* Organize job monitoring based on cluster ID. This approach simplifies interaction with
    the HPCC cluster and minimizes the number of necessary API calls. */
    const jobMonitoringsByCluster = {};
    jobMonitorings.forEach(jobMonitoring => {
      const clusterId = jobMonitoring.clusterId;

      if (!clusterId) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: 'Job monitoring missing cluster ID. Skipping...',
          });
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
    const clustersInfo = await Cluster.findAll({
      where: { id: clusterIds },
      raw: true,
    });
    const clusterInfoObj = {}; // For easy access later

    // Decrypt cluster passwords if they exist
    clustersInfo.forEach(clusterInfo => {
      try {
        clusterInfoObj[clusterInfo.id] = clusterInfo;
        if (clusterInfo.hash) {
          clusterInfo.password = decryptString(clusterInfo.hash);
        } else {
          clusterInfo.password = null;
        }
      } catch (error) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Failed to decrypt hash for cluster ${clusterInfo.id}: ${error.message}`,
          });
      }
    });

    // Get the last time the cluster was scanned for job monitoring purposes
    const lastClusterScanDetails = await MonitoringLog.findAll({
      where: { monitoring_type_id: monitoringTypeId, cluster_id: clusterIds },
      raw: true,
    });

    // Cluster  last scan info (Scan logs)
    clustersInfo.forEach(clusterInfo => {
      const lastScanDetails = lastClusterScanDetails.find(
        scanDetails => scanDetails.cluster_id === clusterInfo.id
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

        // Date to string
        const startTime = clusterInfo.startTime.toISOString();

        let {
          Workunits: { ECLWorkunit },
        } = await wuService.WUQuery({
          StartDate: startTime,
        });
        const wuWithClusterIds = ECLWorkunit.map(wu => {
          return { ...wu, clusterId: clusterInfo.id };
        });

        wuBasicInfoByCluster[clusterInfo.id] = [...wuWithClusterIds];
      } catch (err) {
        failedToReachClusters.push(clusterInfo.id);
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Job monitoring: Error while reaching out to cluster ${clusterInfo.id} : ${err}`,
          });
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
        id => !failedToReachClusters.includes(id)
      );

      for (let id of scanned_clusters) {
        // grab existing metaData
        const log = await MonitoringLog.findOne({
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
          await MonitoringLog.upsert(
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
              conflictTarget: ['cluster_id', 'monitoring_type_id'], // Specify the fields to check for conflicts
            }
          );
        } catch (err) {
          parentPort &&
            parentPort.postMessage({
              level: 'error',
              text: `Job monitoring:  ${err.message}`,
            });
        }
      }
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: 'Job Monitoring: No new work units found for any clusters.',
        });
      return;
    }

    // Clusters with new work units - Done to minimize the number of calls to db later
    const clusterIdsWithNewWUs = Object.keys(wuBasicInfoByCluster);

    const jmWithNewWUs = {};
    let lowerCaseNotificationCondition = [];
    const historyStoringConditions = ['TimeSeriesAnalysis'];
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
      lowerCaseNotificationCondition = notificationCondition.map(condition =>
        condition.toLowerCase()
      );

      // If cluster has no new workunits, skip - reduces computation
      if (!clusterIdsWithNewWUs.includes(clusterId)) {
        continue;
      }

      try {
        const cluster = clustersInfo.find(cluster => cluster.id === clusterId);

        let clusterWUs = wuBasicInfoByCluster[clusterId];

        const matchedWus = clusterWUs.filter(wu => {
          return matchJobName({
            jobNameFormat: jobNameOrPattern,
            jobName: wu.Jobname,
            timezone_offset: cluster.timezone_offset,
          });
        });

        jmWithNewWUs[id] = matchedWus;
      } catch (err) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Job monitoring. Looping job monitorings ${monitoringName}. id:  ${id}. ERR -  ${err.message}`,
          });
      }
    }

    //Wus in failed state failed, aborted, unknown
    const failedStateJobs = [];
    const intermediateStateJobs = [];

    // Check if any jobs are in undesired state
    for (let jmId in jmWithNewWUs) {
      const notificationConditions =
        jobMonitoringObj[jmId]?.metaData?.notificationMetaData
          ?.notificationCondition || [];
      // Iterating over an object
      const wus = jmWithNewWUs[jmId];
      for (let wu of wus) {
        const isJobInIntermediateState = intermediateStates.includes(
          wu.State.toLowerCase()
        );
        const deepMonitoring = notificationConditions.some(item =>
          historyStoringConditions.includes(item)
        );

        // if wu is not in intermediate state and notification condition include historyStoringConditions
        if (!isJobInIntermediateState && deepMonitoring) {
          try {
            const { Wuid, clusterId } = wu;

            // Get wuInfo from cluster
            const wuService = new WorkunitsService(
              getClusterOptions(
                {
                  baseUrl: `${clusterInfoObj[clusterId].thor_host}:${clusterInfoObj[clusterId].thor_port}/`,
                  userID: clusterInfoObj[clusterId].username || '',
                  password: clusterInfoObj[clusterId].password || '',
                },
                clusterInfoObj[clusterId].allowSelfSigned
              )
            );

            const wuInfo = await wuService.WUInfo(WUInfoOptions(Wuid));
            const { Workunit = {} } = wuInfo;

            await JobMonitoringData.create({
              monitoringId: jmId,
              applicationId: jobMonitoringObj[jmId].applicationId,
              wuId: Wuid,
              wuState: Workunit.State,
              wuTopLevelInfo: shallowCopyWithOutNested(Workunit),
              wuDetailInfo: { ...Workunit },
              analzyed: false,
              date: now,
            });
          } catch (err) {
            parentPort &&
              parentPort.postMessage({
                level: 'error',
                text: `Job monitoring: Error while trying to retrieve/save wuInfo for ${wu.Wuid} : ${err.message}`,
              });
          } finally {
            continue;
          }
        }

        // Separate failed state jobs
        if (lowerCaseNotificationCondition.includes(wu.State.toLowerCase())) {
          failedStateJobs.push({ ...wu, jmId });
          continue;
        }

        // Separate intermediate state jobs
        if (intermediateStates.includes(wu.State.toLowerCase())) {
          const jmDetailsToInclude = jobMonitoringObj[jmId];
          if (jmDetailsToInclude.lastJobRunDetails) {
            delete jmDetailsToInclude.lastJobRunDetails;
          }
          intermediateStateJobs.push({
            ...wu,
            jobMonitoringData: jmDetailsToInclude,
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
      let notificationPrefix = 'JM';
      let product;
      let domain;
      let domainRegion;
      let severity;

      if (asrSpecificMetaData && asrSpecificMetaData.productCategory) {
        // Product
        const { name: productName, shortCode } = await getProductCategory(
          asrSpecificMetaData.productCategory
        );
        notificationPrefix = shortCode;
        product = productName;

        //Domain
        const { name: domainName, region } = await getDomain(
          asrSpecificMetaData.domain
        );
        domain = domainName;
        domainRegion = region;

        //Severity
        severity = asrSpecificMetaData.severity;
      }

      // Find severity level (For ASR ) - based on that determine weather to send NOC notification
      let severityThreshHold = 0;
      let severeEmailRecipients = null;

      if (asrSpecificMetaData) {
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
              text: `Job Monitoring : Error while getting Domain level severity : ${error.message}`,
            });
        }
      }

      //Notification payload
      const notificationPayload = createNotificationPayload({
        type: 'email',
        notificationDescription: `Monitoring (${jobMonitoring.monitoringName}) detected that a monitored job is in ${wu.State} state`,
        templateName: 'jobMonitoring',
        originationId: monitoringTypeId,
        applicationId: jobMonitoring.applicationId,
        subject: `Job Monitoring Alert from ${process.env.INSTANCE_NAME} : Job in ${wu.State} state`,
        recipients: { primaryContacts, secondaryContacts, notifyContacts },
        jobName: jobName,
        wuState: wu.State,
        wuId: wu.Wuid,
        monitoringName,
        issue: {
          Issue: `Job in ${wu.State} state`,
          Cluster: clusterInfoObj[clusterId].name || '',
          'Job Name/Filter': jobName,
          'Returned Job': wu.Jobname,
          'Discovered at': findLocalDateTimeAtCluster(
            clusterInfoObj[clusterId].timezone_offset
          ).toLocaleString(),
          State: wu.State,
        },
        notificationId: generateNotificationId({
          notificationPrefix,
          timezoneOffset: clusterInfoObj[clusterId].timezone_offset || 0,
        }),
        asrSpecificMetaData: {
          region: domainRegion,
          product,
          domain,
          severity,
        }, // region: "USA",  product: "Telematics",  domain: "Insurance", severity: 3,
        firstLogged: findLocalDateTimeAtCluster(
          clusterInfoObj[clusterId].timezone_offset
        ).toLocaleString(),
        lastLogged: findLocalDateTimeAtCluster(
          clusterInfoObj[clusterId].timezone_offset
        ).toLocaleString(),
      });

      //Create notification queue
      await NotificationQueue.create(notificationPayload);

      // If severity is above threshold, send out NOC notification
      if (severity >= severityThreshHold && severeEmailRecipients) {
        const notificationPayloadForNoc = _.cloneDeep(notificationPayload);
        notificationPayloadForNoc.metaData.notificationDescription =
          nocAlertDescription;
        notificationPayloadForNoc.metaData.mainRecipients =
          severeEmailRecipients;
        notificationPayloadForNoc.metaData.notificationId =
          generateNotificationId({
            notificationPrefix,
            timezoneOffset: clusterInfoObj[clusterId].timezone_offset || 0,
          });
        delete notificationPayloadForNoc.metaData.cc;
        await NotificationQueue.create(notificationPayloadForNoc);
      }
    }

    // If failed to reach cluster, do not update last monitored time in monitoring logs
    const scannedClusters = clusterIds.filter(
      id => !failedToReachClusters.includes(id)
    );

    // Update monitoring logs
    for (let id of scannedClusters) {
      try {
        //Get existing metadata
        const log = await MonitoringLog.findOne({
          where: { monitoring_type_id: monitoringTypeId, cluster_id: id },
          raw: true,
        });

        // Filter intermediate state jobs for the cluster
        const intermediateStateJobsForCluster = intermediateStateJobs.filter(
          job => job.clusterId === id
        );

        let existingIntermediateStateJobs = [];
        let existingMetaData = {};

        existingMetaData = log?.metaData || {};
        existingIntermediateStateJobs =
          existingMetaData?.wuInIntermediateState || [];

        // Update or create monitoring logs
        await MonitoringLog.upsert({
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
          conflictTarget: ['cluster_id', 'monitoring_type_id'],
        });
      } catch (err) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Job monitoring - ${err.message}`,
            error: err,
          });
      }
    }
  } catch (err) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `Job Monitoring:  Error while monitoring jobs: ${err.message}`,
        error: err,
      });
  } finally {
    if (parentPort) {
      parentPort.postMessage({
        level: 'info',
        text: `Job Monitoring: Monitoring completed in ${new Date() - now} ms`,
      });
    } else {
      process.exit(0);
    }
  }
})();
