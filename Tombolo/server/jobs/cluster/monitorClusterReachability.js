const { parentPort } = require('worker_threads');
const { AccountService } = require('@hpcc-js/comms');

const {
  passwordExpiryAlertDaysForCluster,
} = require('../../config/monitorings.js');
const {
  passwordExpiryInProximityNotificationPayload,
} = require('./clusterReachabilityMonitoringUtils.js');
const { decryptString } = require('../../utils/cipher');
const { Cluster, NotificationQueue } = require('../../models');
const { getClusterOptions } = require('../../utils/getClusterOptions');

(async () => {
  // UTC time
  const now = new Date();
  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Cluster reachability monitoring started ...',
    });

  try {
    // Get clusters and decrypt passwords
    const allClusters = await Cluster.findAll({ raw: true });
    allClusters.forEach(cluster => {
      if (cluster.hash) {
        const password = decryptString(cluster.hash);
        cluster.password = password;
      } else {
        cluster.password = null;
      }
    });

    //Loop through all clusters and check reachability
    for (let cluster of allClusters) {
      // Destructure cluster
      const {
        accountMetaData,
        name: clusterName,
        adminEmails,
        metaData = {},
      } = cluster;

      try {
        // Cluster payload
        const newAccountMetaData = { ...accountMetaData, lastMonitored: now };

        //Create an instance
        const accountService = new AccountService(
          getClusterOptions(
            {
              baseUrl: `${cluster.thor_host}:${cluster.thor_port}`,
              userID: cluster.username,
              password: cluster.password,
            },
            cluster.allowSelfSigned
          )
        );

        // Get account information
        const myAccount = await accountService.MyAccount();
        const { passwordDaysRemaining } = myAccount;

        // If passwordDaysRemaining not in the alert range, update the accountMetaData and continue
        if (
          passwordDaysRemaining &&
          passwordExpiryAlertDaysForCluster.includes(passwordDaysRemaining)
        ) {
          // Check if alert was sent for the day
          const passwordExpiryAlertSentForDay =
            accountMetaData?.passwordExpiryAlertSentForDay;
          if (
            !passwordExpiryAlertSentForDay ||
            passwordExpiryAlertSentForDay !== passwordDaysRemaining
          ) {
            try {
              //Queue notification
              const payload = passwordExpiryInProximityNotificationPayload({
                clusterName,
                templateName: 'hpccPasswordExpiryAlert',
                passwordDaysRemaining,
                recipients: adminEmails || [],
                notificationId: `PWD_EXPIRY_${now.getTime()}`,
              });

              await NotificationQueue.create(payload);

              //Update accountMetaData
              newAccountMetaData.passwordExpiryAlertSentForDay =
                passwordDaysRemaining;
            } catch (err) {
              parentPort &&
                parentPort.postMessage({
                  level: 'error',
                  text: `Cluster reachability:  ${cluster.name} failed to queue notification - ${err.message}`,
                });
            }
          }
        } else {
          //Update accountMetaData
          newAccountMetaData.passwordExpiryAlertSentForDay = null;
        }

        parentPort &&
          parentPort.postMessage({
            level: 'info',
            text: `Cluster reachability:  ${cluster.name} is reachable`,
          });
        // Update accountMetaData
        const newMetaData = { ...metaData };
        newMetaData.reachabilityInfo = {
          lastReachableAt: now,
          reachable: true,
          unReachableMessage: null,
          lastMonitored: now,
        };
        await Cluster.update(
          { accountMetaData: newAccountMetaData, metaData: newMetaData },
          { where: { id: cluster.id } }
        );
      } catch (err) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Cluster reachability:  ${cluster.name} is not reachable -  ${err.message}`,
          });
        const newMetaData = { ...metaData };
        let lastReachabilityInfo = { ...newMetaData.reachabilityInfo };
        lastReachabilityInfo.reachable = false;
        lastReachabilityInfo.unReachableMessage = err.message;
        newMetaData.reachabilityInfo = lastReachabilityInfo;
        newMetaData.lastMonitored = now;
        await Cluster.update(
          { metaData: newMetaData },
          { where: { id: cluster.id } }
        );
      }
    }
  } catch (err) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `Cluster reachability:  monitoring failed - ${err.message}`,
      });
  } finally {
    if (parentPort) {
      parentPort &&
        parentPort.postMessage({
          level: 'info',
          text: `Cluster reachability:  monitoring completed in ${new Date() - now} ms`,
        });
    } else {
      process.exit(0);
    }
  }
})();
