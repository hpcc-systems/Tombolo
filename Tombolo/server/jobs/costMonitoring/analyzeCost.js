const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const {
  CostMonitoring,
  CostMonitoringData,
  NotificationQueue,
  MonitoringType,
  Cluster,
  AsrDomain,
  AsrProduct,
  Integration,
} = require('../../models');
const {
  createNotificationPayload,
  findLocalDateTimeAtCluster,
  generateNotificationId,
  nocAlertDescription,
} = require('../jobMonitoring/monitorJobsUtil');
const { Op } = require('sequelize');
const _ = require('lodash');

const notificationPrefix = 'CM';
const domainMap = new Map();
const productMap = new Map();
let asrEnabled = null;

async function checkIfAsrEnabled() {
  if (asrEnabled === null) {
    const asrIntegration = await Integration.findOne({
      where: { name: 'ASR' },
    });
    asrEnabled = !!asrIntegration;
  }
  return asrEnabled;
}

function createCMNotificationPayload({
  isSummed,
  monitoringType,
  costMonitoring,
  threshold,
  summedCost,
  erroringClusters,
  clusters,
  erroringUsers,
  primaryContacts,
  secondaryContacts,
  notifyContacts,
  asrSpecificMetaData,
  totalErroringCost,
}) {
  let description = '';
  let issueObject = {};
  let tzOffset = 0;
  if (costMonitoring.monitoringScope === 'clusters') {
    tzOffset = erroringClusters[0].timezone_offset || 0;
    description = `Cost Monitoring (${costMonitoring.monitoringName}) detected that clusters have passed the cost threshold`;
    issueObject = {
      Issue: `Cost threshold of ${threshold} passed`,
      'Total Summed Cost': summedCost,
      clusters: erroringClusters.map(cluster => {
        logger.error('clusterObj in create notification', cluster);
        return {
          totalCost: cluster.totalCost,
          fileAccessCost: cluster.fileAccessCost,
          executeCost: cluster.executeCost,
          compileCost: cluster.compileCost,
          clusterName: cluster.clusterName,
          'Discovered At': findLocalDateTimeAtCluster(
            cluster.timezone_offset
          ).toLocaleString(),
        };
      }),
    };
  } else if (costMonitoring.monitoringScope === 'users') {
    tzOffset = clusters[0].timezone_offset || 0;
    description = `Cost Monitoring (${costMonitoring.monitoringName}) detected that users have passed the cost threshold`;
    issueObject = {
      Issue: `Cost monitoring threshold of ${threshold} passed`,
      'Total Cost': totalErroringCost,
      Users: erroringUsers,
      clusters: clusters.map(cluster => ({
        ClusterName: cluster.name || cluster.clusterName,
        'Discovered At': findLocalDateTimeAtCluster(
          cluster.timezone_offset
        ).toLocaleString(),
      })),
    };
  } else {
    throw new Error('Invalid monitoring scope');
  }

  return createNotificationPayload({
    type: 'email',
    notificationDescription: description,
    templateName: 'analyzeCost',
    originationId: monitoringType.id,
    applicationId: costMonitoring.applicationId,
    subject: `Cost Monitoring Alert from ${process.env.INSTANCE_NAME} : Cost threshold $${threshold} passed`,
    recipients: { primaryContacts, secondaryContacts, notifyContacts },
    monitoringName: costMonitoring.monitoringName,
    issue: issueObject,
    asrSpecificMetaData,
    notificationId: generateNotificationId({
      notificationPrefix,
      timezoneOffset: tzOffset,
    }),
    notificationOrigin: 'Cost Monitoring',
    wuId: undefined,
  });
}

async function getAsrData(costMonitoring) {
  let productId = null,
    domainId = null,
    product = null,
    domain = null;

  const asrEnabled = await checkIfAsrEnabled();
  if (asrEnabled && costMonitoring.metaData.asrSpecificMetaData?.domain) {
    productId = costMonitoring.metaData.asrSpecificMetaData.productCategory;
    domainId = costMonitoring.metaData.asrSpecificMetaData.domain;

    // Check and set a local map of product and domain to limit database calls
    if (productMap.has(productId)) {
      product = productMap.get(productId);
    } else {
      product = await AsrProduct.findByPk(productId);
      productMap.set(productId, product);
    }

    if (domainMap.has(domainId)) {
      domain = domainMap.get(domainId);
    } else {
      domain = await AsrDomain.findByPk(domainId);
      domainMap.set(domainId, domain);
    }
  }

  const primaryContacts =
    costMonitoring.metaData.notificationMetaData.primaryContacts;
  const secondaryContacts =
    costMonitoring.metaData.notificationMetaData.secondaryContacts || [];
  const notifyContacts =
    costMonitoring.metaData.notificationMetaData.notifyContacts || [];

  let asrSpecificMetaData = {};

  if (domain && product) {
    asrSpecificMetaData = {
      productShortCode: product.shortCode,
      productName: product.name,
      productTier: product.tier,
      domainName: domain.name,
      region: domain.region,
      severity: domain.severity,
    };
  }

  return {
    domain,
    asrSpecificMetaData,
    primaryContacts,
    secondaryContacts,
    notifyContacts,
  };
}

async function sendNocNotification(
  costMonitoring,
  domain,
  notificationPayload,
  timezoneOffset
) {
  try {
    const asrEnabled = await checkIfAsrEnabled();
    if (!asrEnabled || !domain) return;

    const severityRecipients = domain.severityAlertRecipients;
    const severityThresholdPassed =
      costMonitoring.metaData.asrSpecificMetaData.severity >=
      domain.severityThreshold;
    const hasSeverityRecipients =
      severityRecipients && severityRecipients.length > 0;
    if (severityThresholdPassed && hasSeverityRecipients) {
      const nocNotificationPayload = _.cloneDeep(notificationPayload);
      nocNotificationPayload.metaData.notificationDescription =
        nocAlertDescription;
      nocNotificationPayload.metaData.mainRecipients = severityRecipients;
      nocNotificationPayload.metaData.notificationId = generateNotificationId({
        notificationPrefix,
        timezoneOffset: timezoneOffset || 0,
      });
      delete nocNotificationPayload.metaData.cc;
      await NotificationQueue.create(nocNotificationPayload);
    }
  } catch (nocError) {
    if (parentPort) {
      parentPort.postMessage({
        level: 'error',
        text: `Error in analyzeCost, failed to send noc Notification: ${nocError.message}`,
      });
    } else {
      logger.error(
        'Error in analyzeCost, failed to send noc Notification: ',
        nocError
      );
    }
  }
}

async function emailAlreadySent(monitoringId, clusterId = null) {
  // const whereClause = { monitoringId };
  // if (clusterId) {
  //   whereClause.clusterId = clusterId;
  // }
  // Get the most recent notificationSentDate from costMonitoringData by monitoringId
  // const lastCostMonitoringData = await CostMonitoringData.findOne({
  //   where: whereClause,
  //   order: [['notificationSentDate', 'DESC']],
  // });
  //
  // // NOTE: Maybe allow for setting notificationFrequency on costMonitoring
  // // Check if more than 2 hours since last notification
  // if (
  //   lastCostMonitoringData &&
  //   moment().diff(
  //     moment(lastCostMonitoringData.notificationSentDate),
  //     'hours'
  //   ) < 2
  // ) {
  //   parentPort &&
  //     parentPort.postMessage({
  //       level: 'info',
  //       text: `Notification already sent for analyzeCost: ${monitoringId}`,
  //     });
  //   return true;
  // }
  return false;
}

async function analyzeClusterCost(
  clusterCostTotals,
  costMonitoring,
  monitoringType
) {
  const threshold =
    costMonitoring.metaData.notificationMetaData.notificationCondition;
  const isSummed = costMonitoring.isSummed;
  const aggregatedCostsByCluster = clusterCostTotals.aggregatedCostsByCluster;

  if (!aggregatedCostsByCluster) {
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
      });
    return;
  }

  if (isSummed) {
    const summedCost = clusterCostTotals.overallTotalCost;
    if (summedCost < threshold) {
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
        });
      return;
    }
    const alreadySent = await emailAlreadySent(costMonitoring.id);
    if (alreadySent) return;
    // Build email template and send one

    const {
      primaryContacts,
      secondaryContacts,
      notifyContacts,
      asrSpecificMetaData,
    } = await getAsrData(costMonitoring);

    const erroringClusters = Object.keys(aggregatedCostsByCluster).map(
      clusterId => aggregatedCostsByCluster[clusterId]
    );

    const notificationPayload = createCMNotificationPayload({
      isSummed,
      monitoringType,
      costMonitoring,
      threshold,
      summedCost,
      erroringClusters,
      primaryContacts,
      secondaryContacts,
      notifyContacts,
      asrSpecificMetaData,
    });
    await NotificationQueue.create(notificationPayload);
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Notification(s) sent for analyzeCost (per cluster)',
      });
    // Return after email sent
    return;
  }

  const clustersPastThreshold = [];
  // Iterate over each cluster and check if it's cost is above the threshold
  for (const clusterId in aggregatedCostsByCluster) {
    const clusterCost = aggregatedCostsByCluster[clusterId];
    const clusterTotalCost = clusterCost.totalCost;
    if (clusterTotalCost < threshold) {
      continue;
    }
    // If cost is above threshold, append clusterId to clustersPastThreshold
    clustersPastThreshold.push(clusterId);
  }

  const erroringClusters = clustersPastThreshold.map(
    clusterId => aggregatedCostsByCluster[clusterId]
  );

  if (erroringClusters.length === 0) {
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
      });
    return;
  }

  const alreadySent = await emailAlreadySent(costMonitoring.id);
  if (alreadySent) return;

  const {
    primaryContacts,
    secondaryContacts,
    notifyContacts,
    asrSpecificMetaData,
  } = await getAsrData(costMonitoring);

  logger.error('erroringClusters', erroringClusters);

  // Build a notification and include all of the clusters past threshold.
  const notificationPayload = createCMNotificationPayload({
    isSummed,
    monitoringType,
    costMonitoring,
    threshold,
    erroringClusters,
    primaryContacts,
    secondaryContacts,
    notifyContacts,
    asrSpecificMetaData,
  });

  await NotificationQueue.create(notificationPayload);
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Notification(s) sent for analyzeCost (per cluster)',
    });
}

async function analyzeUserCost(userCostTotals, costMonitoring, monitoringType) {
  const monitoredUsers = costMonitoring.metaData.users; // ["*"] means all users
  const clusterIds = costMonitoring.clusterIds;
  const threshold =
    costMonitoring.metaData.notificationMetaData.notificationCondition;
  // If required, filter costMonitoringTotals to only monitored users
  let costMonitoringTotals;
  if (monitoredUsers[0] === '*') costMonitoringTotals = userCostTotals;
  else {
    costMonitoringTotals = userCostTotals.filter(costMonitoringDataTotal =>
      monitoredUsers.includes(costMonitoringDataTotal.username)
    );
  }

  if (costMonitoring.isSummed) {
    const summedCost = costMonitoringTotals.reduce(
      (sum, costObj) => sum + costObj.totalCost,
      0
    );
    logger.info('summedAmount', summedCost);
    if (summedCost < threshold) {
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
        });
      return;
    }

    const alreadySent = await emailAlreadySent(costMonitoring.id);
    if (alreadySent) return;

    const totalErroringCost = summedCost;

    const {
      domain,
      primaryContacts,
      secondaryContacts,
      notifyContacts,
      asrSpecificMetaData,
    } = await getAsrData(costMonitoring);

    const clusters = await Cluster.findAll({
      where: { id: { [Op.in]: clusterIds } },
    });

    const top5Users = costMonitoringTotals
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    const notificationPayload = createCMNotificationPayload({
      isSummed: false,
      monitoringType,
      costMonitoring,
      threshold,
      erroringUsers: top5Users,
      clusters,
      primaryContacts,
      secondaryContacts,
      notifyContacts,
      asrSpecificMetaData,
      totalErroringCost,
    });

    await NotificationQueue.create(notificationPayload);
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Notification(s) sent for analyzeCost',
      });

    await sendNocNotification(
      costMonitoring,
      domain,
      notificationPayload,
      clusters[0].timezone_offset
    );

    // Return to ensure non-summed code is not executed
    return;
  }

  // Ensure no thresholds have been passed
  const totalsCausingNotification = costMonitoringTotals.filter(
    total => total.totalCost > threshold
  );

  if (totalsCausingNotification.length === 0) {
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
      });
    return;
  }

  const erroringUsers = totalsCausingNotification.map(total => ({
    username: total.username,
    totalCost: total.totalCost,
  }));

  const totalErroringCost = totalsCausingNotification.reduce(
    (sum, total) => sum + total.totalCost,
    0
  );

  const alreadySent = await emailAlreadySent(costMonitoring.id);
  if (alreadySent) return;

  const {
    domain,
    primaryContacts,
    secondaryContacts,
    notifyContacts,
    asrSpecificMetaData,
  } = await getAsrData(costMonitoring);

  const clusters = await Cluster.findAll({
    where: { id: { [Op.in]: clusterIds } },
  });

  const notificationPayload = createCMNotificationPayload({
    isSummed: false,
    monitoringType,
    costMonitoring,
    threshold,
    erroringUsers,
    clusters,
    primaryContacts,
    secondaryContacts,
    notifyContacts,
    asrSpecificMetaData,
    totalErroringCost,
  });

  await NotificationQueue.create(notificationPayload);
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Notification(s) sent for analyzeCost',
    });

  await sendNocNotification(
    costMonitoring,
    domain,
    notificationPayload,
    clusters[0].timezone_offset
  );

  const lastCostMonitoringData = await CostMonitoringData.findOne({
    where: { monitoringId: costMonitoring.id },
    order: [['notificationSentDate', 'DESC']],
  });
  lastCostMonitoringData.notificationSentDate = new Date();
  await lastCostMonitoringData.save();
}

async function analyzeCost() {
  try {
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Analyze Cost Per user: started ...',
      });

    const monitoringType = await MonitoringType.findOne({
      where: { name: 'Cost Monitoring' },
      attributes: ['id'],
    });

    // get costMonitorings
    const costMonitorings = await CostMonitoring.findAll();
    for (const costMonitoring of costMonitorings) {
      try {
        const monitoringScope = costMonitoring.monitoringScope;

        if (monitoringScope === 'clusters') {
          const clusterMonitoringTotals =
            await CostMonitoringData.getClusterDataTotals(costMonitoring.id);
          await analyzeClusterCost(
            clusterMonitoringTotals,
            costMonitoring,
            monitoringType
          );
        } else if (monitoringScope === 'users') {
          const allCostMonitoringTotals =
            await CostMonitoringData.getDataTotals(costMonitoring.id);
          await analyzeUserCost(
            allCostMonitoringTotals,
            costMonitoring,
            monitoringType
          );
        } else {
          parentPort &&
            parentPort.postMessage({
              level: 'error',
              text: `Invalid monitoring scope (${monitoringScope}) for analyzeCost: ${costMonitoring.id}`,
            });
        }
      } catch (err) {
        if (parentPort) {
          parentPort.postMessage({
            level: 'error',
            text: `Failed to analyzeCost ${costMonitoring.id}: ${err.message}`,
          });
          logger.error(`Failed to analyzeCost ${costMonitoring.id}: `, err);
        } else {
          logger.error(`Failed to analyzeCost ${costMonitoring.id}: `, err);
        }
      }
    }
  } catch (err) {
    if (parentPort) {
      parentPort.postMessage({
        level: 'error',
        text: `Error in analyzeCost: ${err.message}`,
      });
    } else {
      logger.error('Error in analyzeCost: ', err);
    }
  }
}

(async () => {
  await analyzeCost();
})();
