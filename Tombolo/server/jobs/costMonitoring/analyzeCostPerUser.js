const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const {
  costMonitoring: CostMonitoring,
  costMonitoringData: CostMonitoringData,
  notification_queue: NotificationQueue,
  monitoring_types: MonitoringTypes,
  costMonitoringDataTotals: CostMonitoringDataTotals,
  cluster: Cluster,
} = require('../../models');
const {
  createNotificationPayload,
  findLocalDateTimeAtCluster,
  generateNotificationId,
} = require('../jobMonitoring/monitorJobsUtil');
const { Op } = require('sequelize');
const moment = require('moment');

async function analyzeCostPerUser() {
  try {
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Analyze Cost Per user: started ...',
      });

    const monitoringType = await MonitoringTypes.findOne({
      where: { name: 'Cost Monitoring' },
      attributes: ['id'],
    });

    // get costMonitorings (are all deletedAt's ignored)
    const costMonitorings = await CostMonitoring.findAll();
    for (const costMonitoring of costMonitorings) {
      const monitoredUsers = costMonitoring.metaData.users; // ["*"] means all users
      const clusterIds = costMonitoring.clusterIds;

      const allCostMonitoringTotals = await CostMonitoringDataTotals.findAll({
        where: { monitoringId: costMonitoring.id },
      });

      // If required, filter costMonitoringTotals to only monitored users
      let costMonitoringTotals;
      if (monitoredUsers[0] === '*')
        costMonitoringTotals = allCostMonitoringTotals;
      else {
        costMonitoringTotals = allCostMonitoringTotals.filter(
          costMonitoringDataTotal =>
            monitoredUsers.includes(costMonitoringDataTotal.username)
        );
      }

      // Ensure no thresholds have been passed
      const threshold =
        costMonitoring.metaData.notificationMetaData.notificationCondition;

      const totalsCausingNotification = costMonitoringTotals.filter(
        total => total.totalCost > threshold
      );

      if (totalsCausingNotification.length === 0) {
        parentPort &&
          parentPort.postMessage({
            level: 'info',
            text: `No thresholds passed for analyzeCostPerUser: ${costMonitoring.id}`,
          });
        continue;
      }

      const erroringUsers = totalsCausingNotification.map(total => ({
        username: total.username,
        totalCost: total.totalCost,
      }));

      const totalErroringCost = totalsCausingNotification.reduce(
        (sum, total) => sum + total.totalCost,
        0
      );

      // Get the most recent costMonitoringData
      const lastCostMonitoringData = await CostMonitoringData.findOne({
        where: { monitoringId: costMonitoring.id },
        order: [['notificationSentDate', 'DESC']],
      });

      // NOTE: Maybe allow for setting notificationFrequency on costMonitoring
      // Check if more than 2 hours since last notification
      if (
        lastCostMonitoringData &&
        moment().diff(
          moment(lastCostMonitoringData.notificationSentDate),
          'hours'
        ) < 2
      ) {
        parentPort &&
          parentPort.postMessage({
            level: 'info',
            text: `Notification already sent for analyzeCostPerUser: ${costMonitoring.id}`,
          });
        continue;
      }

      const primaryContacts =
        costMonitoring.metaData.notificationMetaData.primaryContacts;
      const secondaryContacts = [];
      const notifyContacts = [];

      const clusters = await Cluster.findAll({
        where: { id: { [Op.in]: clusterIds } },
      });
      const notificationPrefix = 'CM';

      // TODO: The Discovered at seems to be wrong? Showing 4 PM at actual 12 PM on play cluster
      const notificationPayload = createNotificationPayload({
        type: 'email',
        notificationDescription: `Cost Monitoring (${costMonitoring.monitoringName}) detected that a user passed the cost threshold`,
        templateName: 'analyzeCostPerUser',
        originationId: monitoringType.id,
        applicationId: costMonitoring.applicationId,
        subject: `Cost Monitoring Alert from ${process.env.INSTANCE_NAME} : Cost threshold $${threshold} passed`,
        recipients: { primaryContacts, secondaryContacts, notifyContacts },
        monitoringName: costMonitoring.monitoringName,
        issue: {
          Issue: `Cost monitoring threshold of ${threshold} passed`,
          'Total Cost': totalErroringCost,
          Users: erroringUsers,
          clusters: clusters.map(cluster => ({
            ClusterName: cluster.name,
            'Discovered At': findLocalDateTimeAtCluster(
              cluster.timezone_offset
            ).toLocaleString(),
          })),
        },
        asrSpecificMetaData: costMonitoring.metaData.asrSpecificMetaData,
        notificationId: generateNotificationId({
          notificationPrefix,
          timezoneOffset: clusters[0].timezone_offset || 0,
        }),
        notificationOrigin: 'Cost Monitoring',
        wuId: undefined,
      });

      await NotificationQueue.create(notificationPayload);
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: 'Notification(s) sent for analyzeCostPerUser',
        });

      lastCostMonitoringData.notificationSentDate = new Date();
      await lastCostMonitoringData.save();
    }
  } catch (err) {
    if (parentPort) {
      parentPort.postMessage({
        level: 'error',
        text: `Error in analyzeCostPerUser: ${err.message}`,
      });
    } else {
      logger.error('Error in analyzeCostPerUser: ', err);
    }
  }
}

(async () => {
  await analyzeCostPerUser();
})();
