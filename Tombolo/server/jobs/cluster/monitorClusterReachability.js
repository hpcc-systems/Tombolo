const { parentPort } = require("worker_threads");
const {AccountService} = require("@hpcc-js/comms")

const logger = require("../../config/logger.js");
const {passwordExpiryAlertDaysForCluster} = require("../../config/monitorings.js");
const {clusterAccountNotificationPayload} = require("./clusterMonitoringUtils.js");
const { decryptString } = require("../../utils/cipher");
const models = require("../../models");
const Cluster = models.cluster;

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
        // payload 
        const newAccountMetaData = {...cluster.accountMetaData, lastMonitored: now};
        
        //Create an instance
        const accountService = new AccountService({
            baseUrl: `${cluster.thor_host}:${cluster.thor_port}`,
            userID: cluster.username, // TODO - for test purposes
            password: cluster.password,
        });

        // Get account information
        const myAccount = await accountService.MyAccount();
        const {
          passwordNeverExpires,
          passwordIsExpired,
          passwordDaysRemaining,
          firstName,
        } = myAccount;

        // console.log('------------------------------------------');
        // console.log(cluster.name)
        console.dir({
          passwordNeverExpires,
          passwordIsExpired,
          passwordDaysRemaining,
          firstName,
        });
        // console.log('------------------------------------------');
       
        // If password never expires, update the accountMetaData and continue
        if(passwordNeverExpires || passwordNeverExpires == null){ // API returns true, false or null
          try{
            await Cluster.update({accountMetaData: newAccountMetaData}, {where: {id: cluster.id}});
          }catch(err){
            logger.error(`Cluster reachability: update cluster ${cluster.id} ${err.message}`);
          }
           continue;
        }

        // If passwordDaysRemaining not in the alert range, update the accountMetaData and continue
        if(passwordDaysRemaining > passwordExpiryAlertDaysForCluster){
          try{
            await Cluster.update({accountMetaData: newAccountMetaData}, {where: {id: cluster.id}});
          }catch(err){
            logger.error(`Cluster reachability: update cluster ${cluster.id} ${err.message}`);
          }
          continue;
        }


        // If password expired and the alert was not sent in past - send alert
        if (passwordIsExpired) {
          //TODO - send alert to user
        }

        // If password expiry days remaining is in alert range and alert was not sent in past - send alert

      }catch(err){
        logger.error(`Cluster reachability:  ${cluster.name} is unreachable ${err.message}`);
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