const { parentPort } = require("worker_threads");
const {AccountService} = require("@hpcc-js/comms")

const logger = require("../../config/logger.js");
const {passwordExpiryAlertDaysForCluster} = require("../../config/monitorings.js");
const {passwordExpiryInProximityNotificationPayload} = require("./clusterReachabilityMonitoringUtils.js");
const { decryptString } = require("../../utils/cipher");
const models = require("../../models");

const Cluster = models.cluster;
const NotificationQueue = models.notification_queue;

(async() => {
    // UTC time 
    const now = new Date();

    try {

    // Get clusters and decrypt passwords
      const allClusters = await Cluster.findAll({ raw: true });
      allClusters.forEach(cluster => {
        if(cluster.hash){
            const password = decryptString(cluster.hash);
            cluster.password = password;
        }else{
            cluster.password = null;
        }
      });

    //Loop through all clusters and check reachability
    for(let cluster of allClusters){
      try{
        // Destructure cluster
        const { accountMetaData, name: clusterName, metaData: clusterMetaData } = cluster;

        // Cluster payload 
        const newAccountMetaData = {...accountMetaData, lastMonitored: now};
        
        //Create an instance
        const accountService = new AccountService({
            baseUrl: `${cluster.thor_host}:${cluster.thor_port}`,
            userID: cluster.username,
            password: cluster.password,
        });

        // Get account information
        const myAccount = await accountService.MyAccount();
        const {passwordDaysRemaining} = myAccount;

        // If passwordDaysRemaining not in the alert range, update the accountMetaData and continue
        if(passwordDaysRemaining && passwordExpiryAlertDaysForCluster.includes(passwordDaysRemaining)){
            // Check if alert was sent for the day
            const passwordExpiryAlertSentForDay = accountMetaData?.passwordExpiryAlertSentForDay;
            if ( !passwordExpiryAlertSentForDay || passwordExpiryAlertSentForDay !== passwordDaysRemaining) {
              try{
                //Queue notification
                const payload = passwordExpiryInProximityNotificationPayload({
                  clusterName,
                  templateName: "hpccPasswordExpiryAlert",
                  passwordDaysRemaining,
                  recipients: clusterMetaData?.adminEmails || [],
                  notificationId: `PWD_EXPIRY_${now.getTime()}`,
                });

                await NotificationQueue.create(payload);
                
                //Update accountMetaData
                newAccountMetaData.passwordExpiryAlertSentForDay =  passwordDaysRemaining;
              }catch(err){
                logger.error(`Cluster reachability:  ${cluster.name} failed to queue notification ${err}`);
              }
            }
        }else{
            //Update accountMetaData
            newAccountMetaData.passwordExpiryAlertSentForDay =  null;
        }

        // Update accountMetaData
        await Cluster.update({accountMetaData: newAccountMetaData}, {where: {id: cluster.id}});

      }catch(err){
        logger.error(`Cluster reachability:  ${cluster.name} is unreachable ${err}`);
      }
    }

    } catch (err) {
      logger.error(err);
    } finally {
      logger.debug(`Cluster reachability monitoring completed ${now}}`
      );
      if (parentPort) parentPort.postMessage("done");
      else process.exit(0);
    }
})();