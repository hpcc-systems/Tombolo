const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const {
  costMonitoring: CostMonitoring,
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
      const clusterIds = costMonitorings.clusterIds;

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
        // TODO: Should there be a better message here?
        parentPort.postMessage({
          level: 'info',
          text: `No thresholds passed for analyzeCostPerUser: ${costMonitoring.id}`,
        });
        continue;
      }

      const primaryContacts =
        costMonitoring.metaData.notificationMetaData.primaryContacts;
      const secondaryContacts = [];
      const notifyContacts = [];

      const clusters = Cluster.findAll({ where: { id: clusterIds } });
      const notificationPrefix = 'CM';

      const notificationPayload = createNotificationPayload({
        type: 'email',
        notificationDescription: `Cost Monitoring (${costMonitoring.monitoringName}) detected that a user passed the cost threshold`,
        templateName: 'analyzeCostPerUser', // TODO: Ensure this template exists
        originationId: monitoringType.id,
        applicationId: costMonitoring.applicationId,
        subject: `Cost Monitoring Alert from ${process.env.INSTANCE_NAME} : Cost threshold $${threshold} passed`,
        recipients: { primaryContacts, secondaryContacts, notifyContacts },
        monitoringName: costMonitoring.monitoringName,
        issue: {
          Issue: `Cost monitoring threshold of ${threshold} passed`,
          clusters: clusters.map(cluster => ({
            ClusterName: cluster.name,
            'Discovered At': findLocalDateTimeAtCluster(
              cluster.timezone_offset
            ).toLocaleString(),
          })),
        },
        notificationId: generateNotificationId({
          notificationPrefix,
          timezoneOffset: clusters[0].timezone_offset || 0,
        }),
      });

      await NotificationQueue.create(notificationPayload);
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: 'Notification(s) sent for analyzeCostPerUser',
        });
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
