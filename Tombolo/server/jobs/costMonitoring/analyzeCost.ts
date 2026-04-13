import { logOrPostMessage } from '../jobUtils.js';
import {
  CostMonitoring,
  CostMonitoringData,
  NotificationQueue,
  MonitoringType,
  Cluster,
  AsrDomain,
  AsrProduct,
  Integration,
  SentNotification,
} from '@tombolo/db';
import {
  createNotificationPayload,
  findLocalDateTimeAtCluster,
  generateNotificationId,
  nocAlertDescription,
  generateNotificationIdempotencyKey,
} from '../jobMonitoring/monitorJobsUtil.js';
import { Op } from 'sequelize';
import _ from 'lodash';
import currencyCodeToSymbol from '../../utils/currencyCodeToSymbol.js';
import { msGraphClient, extractFirstName } from '../../utils/msGraphHelper.js';

const notificationPrefix = 'CM';
const domainMap = new Map();
const productMap = new Map();
const clusterMap = new Map();
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

function buildCMIdempotencyKey({ costMonitoring, totalCost }) {
  const threshold =
    costMonitoring.metaData.notificationMetaData.notificationCondition;
  const thresholdSignature = `sum:${costMonitoring.isSummed}:gte:${threshold}`;
  const usersSignature = costMonitoring.metaData.users?.join(',') ?? '';
  return generateNotificationIdempotencyKey({
    prefix: notificationPrefix,
    applicationId: costMonitoring.applicationId,
    monitoringId: costMonitoring.id,
    scope: costMonitoring.monitoringScope,
    clusterIds: costMonitoring.clusterIds,
    dayBucket: new Date().toISOString().split('T')[0],
    specificSignature: `${usersSignature}|${thresholdSignature}|total:${totalCost.toFixed(2)}`,
  });
}

function createCMNotificationPayload({
  monitoringType,
  costMonitoring,
  threshold,
  erroringClusters,
  clusters,
  erroringUsers,
  primaryContacts,
  secondaryContacts,
  notifyContacts,
  asrSpecificMetaData,
  idempotencyKey,
  currencyCode = 'USD',
  templateName = 'analyzeCost',
  userName = undefined,
}) {
  const currencySymbol = currencyCodeToSymbol(currencyCode);
  let description = '';
  let issueObject = {};
  let tzOffset = 0;
  if (costMonitoring.monitoringScope === 'clusters') {
    tzOffset = erroringClusters[0].timezone_offset || 0;
    description = `Cost Monitoring (${costMonitoring.monitoringName}) detected that cluster(s) have passed the cost threshold`;
    issueObject = {
      Issue: `Cost threshold of ${currencySymbol}${threshold} passed`,
      clusters: erroringClusters.map(cluster => {
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
    description = `Cost Monitoring (${costMonitoring.monitoringName}) detected that user(s) have passed the cost threshold`;
    issueObject = {
      Issue: `Cost threshold of ${currencySymbol}${threshold} passed`,
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

  const currentTime = findLocalDateTimeAtCluster(tzOffset);

  // Add userName to metaData if provided (for individual notifications)
  const metaData = userName
    ? { ...asrSpecificMetaData, userName }
    : asrSpecificMetaData;

  return createNotificationPayload({
    type: 'email',
    notificationDescription: description,
    templateName,
    originationId: monitoringType.id,
    applicationId: costMonitoring.applicationId,
    subject: `Cost Monitoring Alert from ${process.env.INSTANCE_NAME} : Cost threshold ${currencySymbol}${threshold} passed`,
    recipients: { primaryContacts, secondaryContacts, notifyContacts },
    issue: { currencySymbol, ...issueObject },
    asrSpecificMetaData: metaData,
    notificationId: generateNotificationId({
      notificationPrefix,
      timezoneOffset: tzOffset,
    }),
    notificationOrigin: 'Cost Monitoring',
    wuId: undefined,
    firstLogged: currentTime,
    lastLogged: currentTime,
    idempotencyKey,
  });
}

// Use the clusterMap to reduce database calls when the cluster has already been retrieved during job execution
async function getClusters(clusterIds) {
  const resultClusters = [];
  const clustersToGet = [];
  for (const clusterId of clusterIds) {
    if (clusterMap.has(clusterId)) {
      resultClusters.push(clusterMap.get(clusterId));
    } else {
      clustersToGet.push(clusterId);
    }
  }

  if (clustersToGet.length === 0) return resultClusters;

  const retrievedClusters = await Cluster.findAll({
    where: { id: { [Op.in]: clustersToGet } },
  });

  for (const cluster of retrievedClusters) {
    clusterMap.set(cluster.id, cluster);
    resultClusters.push(cluster);
  }

  return resultClusters;
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
      nocNotificationPayload.metaData.idempotencyKey =
        nocNotificationPayload.metaData.idempotencyKey + '|NOC';
      await NotificationQueue.create(nocNotificationPayload);
    }
  } catch (nocError) {
    logOrPostMessage({
      level: 'error',
      text: `Error in analyzeCost, failed to send noc Notification: ${nocError.message}`,
    });
  }
}

async function emailAlreadySent(idempotencyKey) {
  const existingNotification = await SentNotification.findOne({
    where: { idempotencyKey },
  });
  if (existingNotification) {
    logOrPostMessage({
      level: 'info',
      text: `Cost Monitoring email already sent for idempotencyKey: ${idempotencyKey}`,
    });
  }

  return !!existingNotification;
}

/**
 * Send individual notifications to each user and their manager
 * for users who have exceeded the cost threshold
 */
async function notifyIndividualUsersAndManagers(
  erroringUsers,
  costMonitoring,
  monitoringType,
  threshold,
  clusters,
  currencyCode,
  asrSpecificMetaData
) {
  try {
    logOrPostMessage({
      level: 'info',
      text: `Notifying ${erroringUsers.length} individual users and their managers`,
    });

    for (const erroringUser of erroringUsers) {
      try {
        // Fetch user and manager details from MS Graph
        const username = erroringUser.username;
        const usernameWithDomain = `${username}@`;

        logOrPostMessage({
          level: 'info',
          text: `Fetching MS Graph data for user: ${username}`,
        });

        const contacts =
          await msGraphClient.getUserWithManager(usernameWithDomain);

        if (!contacts?.user) {
          logOrPostMessage({
            level: 'warn',
            text: `No user found in MS Graph for username: ${username}`,
          });
          continue;
        }

        const userEmail = contacts.user.mail;
        const managerEmail = contacts.manager?.mail;

        // Get configuration for who should receive notifications
        const ownerAndSupervisorConfig =
          costMonitoring.metaData?.notificationMetaData?.ownerAndSupervisor ||
          {};

        const notifyOwner = ownerAndSupervisorConfig.includes('owner') === true;
        const notifySupervisor =
          ownerAndSupervisorConfig.includes('supervisor') === true;

        // Determine recipients based on configuration
        const primaryContacts = [];
        const secondaryContacts = [];

        if (notifyOwner && userEmail) {
          primaryContacts.push(userEmail);
        }

        if (notifySupervisor && managerEmail) {
          secondaryContacts.push(managerEmail);
        }

        // Skip if no recipients configured
        if (primaryContacts.length === 0 && secondaryContacts.length === 0) {
          logOrPostMessage({
            level: 'warn',
            text: `No recipients configured for user: ${username}. Owner: ${notifyOwner}, Supervisor: ${notifySupervisor}`,
          });
          continue;
        }

        // Build unique idempotency key for individual user notification
        // Uses different prefix and scope to avoid collision with admin notifications
        const userIdempotencyKey = generateNotificationIdempotencyKey({
          prefix: `${notificationPrefix}_INDIVIDUAL`,
          applicationId: costMonitoring.applicationId,
          monitoringId: costMonitoring.id,
          scope: 'user',
          clusterIds: costMonitoring.clusterIds,
          dayBucket: new Date().toISOString().split('T')[0],
          specificSignature: `username:${username}|cost:${erroringUser.totalCost.toFixed(2)}|threshold:${threshold}`,
        });

        // Check if notification already sent
        const alreadySent = await emailAlreadySent(userIdempotencyKey);
        if (alreadySent) continue;

        // Calculate how much the threshold was exceeded
        const totalCost = erroringUser.totalCost;
        const exceededBy = totalCost - threshold;
        const firstName = extractFirstName(contacts.user.displayName);

        // Create notification payload for this specific user
        const notificationPayload = createCMNotificationPayload({
          monitoringType,
          costMonitoring,
          threshold,
          erroringClusters: [],
          erroringUsers: [erroringUser], // Only this user
          clusters,
          primaryContacts,
          secondaryContacts,
          notifyContacts: [],
          asrSpecificMetaData: {
            ...asrSpecificMetaData,
            totalCost,
            exceededBy,
            ownerId: username,
            instanceName: process.env.INSTANCE_NAME,
          },
          idempotencyKey: userIdempotencyKey,
          currencyCode,
          templateName: 'analyzeCostIndividual',
          userName: firstName,
        });

        // Queue the notification
        await NotificationQueue.create(notificationPayload as any);

        const recipientInfo = [];
        if (primaryContacts.length > 0)
          recipientInfo.push(`TO: ${primaryContacts.join(', ')}`);
        if (secondaryContacts.length > 0)
          recipientInfo.push(`CC: ${secondaryContacts.join(', ')}`);

        logOrPostMessage({
          level: 'info',
          text: `Individual notification queued for user: ${username} (${recipientInfo.join(', ')})`,
        });
      } catch (userError) {
        logOrPostMessage({
          level: 'error',
          text: `Failed to process individual notification for user ${erroringUser.username}: ${userError.message}`,
        });
      }
    }

    logOrPostMessage({
      level: 'info',
      text: 'Finished processing individual user notifications',
    });
  } catch (error) {
    logOrPostMessage({
      level: 'error',
      text: `Error in notifyIndividualUsersAndManagers: ${error.message}`,
    });
  }
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

  // Get clusterIds from clusterCostTotals
  const clusterIds = Object.keys(clusterCostTotals.aggregatedCostsByCluster);
  // Get clusters from clusterIds and use currencyCode from the first cluster
  const clusters = await getClusters(clusterIds);
  const currencyCode = clusters[0]?.currencyCode || 'USD';

  if (!aggregatedCostsByCluster) {
    logOrPostMessage({
      level: 'info',
      text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
    });
    return;
  }

  if (isSummed) {
    const summedCost = clusterCostTotals.overallTotalCost;
    if (summedCost < threshold) {
      logOrPostMessage({
        level: 'info',
        text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
      });
      return;
    }

    const idempotencyKey = buildCMIdempotencyKey({
      costMonitoring,
      totalCost: summedCost,
    });
    const alreadySent = await emailAlreadySent(idempotencyKey);
    if (alreadySent) return;

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
      monitoringType,
      costMonitoring,
      threshold,
      erroringClusters,
      clusters: [],
      erroringUsers: [],
      primaryContacts,
      secondaryContacts,
      notifyContacts,
      asrSpecificMetaData,
      idempotencyKey,
      currencyCode,
    });

    await NotificationQueue.create(notificationPayload as any);
    logOrPostMessage({
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
    logOrPostMessage({
      level: 'info',
      text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
    });
    return;
  }

  const summedCost = clusterCostTotals.overallTotalCost;

  const idempotencyKey = buildCMIdempotencyKey({
    costMonitoring,
    totalCost: summedCost,
  });
  const alreadySent = await emailAlreadySent(idempotencyKey);
  if (alreadySent) return;

  const {
    primaryContacts,
    secondaryContacts,
    notifyContacts,
    asrSpecificMetaData,
  } = await getAsrData(costMonitoring);

  // Build a notification and include all of the clusters past threshold.
  const notificationPayload = createCMNotificationPayload({
    monitoringType,
    costMonitoring,
    threshold,
    erroringClusters,
    clusters: [],
    erroringUsers: [],
    primaryContacts,
    secondaryContacts,
    notifyContacts,
    asrSpecificMetaData,
    idempotencyKey,
    currencyCode,
  });

  await NotificationQueue.create(notificationPayload as any);
  logOrPostMessage({
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

  const clusters = await getClusters(clusterIds);
  // We only need the first cluster to get the currency code as differing currency codes in a single monitoring are not supported
  const currencyCode = clusters[0].currencyCode || 'USD';

  if (costMonitoring.isSummed) {
    const summedCost = costMonitoringTotals.reduce(
      (sum, costObj) => sum + costObj.totalCost,
      0
    );
    if (summedCost < threshold) {
      logOrPostMessage({
        level: 'info',
        text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
      });
      return;
    }

    const idempotencyKey = buildCMIdempotencyKey({
      costMonitoring,
      totalCost: summedCost,
    });

    const alreadySent = await emailAlreadySent(idempotencyKey);
    if (alreadySent) return;

    const {
      domain,
      primaryContacts,
      secondaryContacts,
      notifyContacts,
      asrSpecificMetaData,
    } = await getAsrData(costMonitoring);

    const top5Users = costMonitoringTotals
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    const notificationPayload = createCMNotificationPayload({
      monitoringType,
      costMonitoring,
      threshold,
      erroringClusters: [],
      erroringUsers: top5Users,
      clusters,
      primaryContacts,
      secondaryContacts,
      notifyContacts,
      asrSpecificMetaData,
      idempotencyKey,
      currencyCode,
    });

    await NotificationQueue.create(notificationPayload as any);
    logOrPostMessage({
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
    logOrPostMessage({
      level: 'info',
      text: `No thresholds passed for analyzeCost: ${costMonitoring.id}`,
    });
    return;
  }

  const erroringUsers = totalsCausingNotification.map(total => ({
    username: total.username,
    fileAccessCost: total.fileAccessCost,
    compileCost: total.compileCost,
    executeCost: total.executeCost,
    clusterName: total.clusterName,
    totalCost: total.totalCost,
  }));

  const summedCost = totalsCausingNotification.reduce(
    (sum, total) => sum + total.totalCost,
    0
  );

  const idempotencyKey = buildCMIdempotencyKey({
    costMonitoring,
    totalCost: summedCost,
  });
  const alreadySent = await emailAlreadySent(idempotencyKey);
  if (alreadySent) return;

  const {
    domain,
    primaryContacts,
    secondaryContacts,
    notifyContacts,
    asrSpecificMetaData,
  } = await getAsrData(costMonitoring);

  const notificationPayload = createCMNotificationPayload({
    monitoringType,
    costMonitoring,
    threshold,
    erroringClusters: [],
    erroringUsers,
    clusters,
    primaryContacts,
    secondaryContacts,
    notifyContacts,
    asrSpecificMetaData,
    idempotencyKey,
    currencyCode,
  });

  await NotificationQueue.create(notificationPayload as any);
  logOrPostMessage({
    level: 'info',
    text: 'Notification(s) sent for analyzeCost',
  });

  await sendNocNotification(
    costMonitoring,
    domain,
    notificationPayload,
    clusters[0].timezone_offset
  );

  // Check if owner/supervisor notifications are configured
  const ownerAndSupervisorConfig =
    costMonitoring.metaData?.notificationMetaData?.ownerAndSupervisor;

  if (
    Array.isArray(ownerAndSupervisorConfig) &&
    ownerAndSupervisorConfig.length > 0
  ) {
    // Send individual notifications to users and their managers
    await notifyIndividualUsersAndManagers(
      erroringUsers,
      costMonitoring,
      monitoringType,
      threshold,
      clusters,
      currencyCode,
      asrSpecificMetaData
    );
  } else {
    logOrPostMessage({
      level: 'info',
      text: `Owner/supervisor notifications not configured for cost monitoring: ${costMonitoring.id}`,
    });
  }
}

async function analyzeCost() {
  try {
    logOrPostMessage({
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
          logOrPostMessage({
            level: 'error',
            text: `Invalid monitoring scope (${monitoringScope}) for analyzeCost: ${costMonitoring.id}`,
          });
        }
      } catch (err) {
        logOrPostMessage({
          level: 'error',
          text: `Failed to analyzeCost ${costMonitoring.id}: ${err.message}`,
        });
      }
    }
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `Error in analyzeCost: ${err.message}`,
    });
  }
}

(async () => {
  await analyzeCost();
})();

export {
  buildCMIdempotencyKey,
  createCMNotificationPayload,
  getClusters,
  getAsrData,
  sendNocNotification,
  emailAlreadySent,
  notifyIndividualUsersAndManagers,
  analyzeClusterCost,
  analyzeUserCost,
  analyzeCost,
};
