// Imports
const { parentPort, workerData } = require("worker_threads");
const { decryptString } = require("../../utils/cipher");

// Local Imports
const models = require("../../models");
const { WorkunitsService } = require("@hpcc-js/comms");
const shallowCopyWithoutNested = require("../../utils/shallowCopyWithoutNested.js");
const { WUInfoOptions} = require('./monitorJobsUtil');

// Local Variables
const cluster = models.cluster;
const JobMonitoringData = models.jobMonitoring_Data;

// Self Invoking function
(async() =>{
  const { job } = workerData;
  const { clusterId, jobName, monitoringId, applicationId } = job.data;
    try{
      const startTime = new Date().getTime();
      parentPort && parentPort.postMessage({level: "info", text: `Fetch Workunit Info - started`});

      // Get cluster information
      const clusterInfo = await cluster.findOne({
        where: { id: clusterId },
        attributes: ["id", "name", "thor_host","roxie_host","thor_port","roxie_port", "username", "hash"],
      });

      // If no cluster info is present, return
      if (!clusterInfo) {
        parentPort &&
          parentPort.postMessage({
            level: "error",
            text: `Fetch Workunit Info - Cluster with id ${clusterId} not found`,
          });
        return;
      }

      // If cluster information & hash present - decrypt
      if (clusterInfo) {
        if(clusterInfo.hash){
          clusterInfo.password = decryptString(clusterInfo.hash);
        }else{
          clusterInfo.password = null;
        }
      }

      // Create WorkunitService
      const wuService = new WorkunitsService({
        baseUrl: `${clusterInfo.thor_host}:${clusterInfo.thor_port}/`,
        userID: clusterInfo.username || "",
        password: clusterInfo.password || "",
      });
      
      // Get Matching work unites 
      let {
        Workunits: { ECLWorkunit },
      } = await wuService.WUQuery({
        Jobname: jobName,
        Count:10,
        State: "completed",
      });

      // If no workunits found, return
      if (ECLWorkunit.length === 0) {
        parentPort &&
          parentPort.postMessage({
            level: "info",
            text: `Fetch Workunit Info - No workunits found for job ${jobName}`,
          });
        return;
      }

      // Get workunit info for all workunits
      const workUnits = ECLWorkunit.map(wu =>{
      return wu.Wuid;
      })

      // Iterate over workunits and get wuInfo
      const allWuInfo = [];

      for (const wu of workUnits) {
        const wuInfoParams = WUInfoOptions(wu);
        const wuInfo = await wuService.WUInfo({
          ...wuInfoParams,
        });
        allWuInfo.push(wuInfo.Workunit || {});
      }   

      // Iterate over allWuInfo and create wuTopLevelInfo array
      const wuTopLevelInfo = allWuInfo.map(wu =>{
        return shallowCopyWithoutNested(wu);
      });

      // Create rows for job Monitoring data
      const jmDataRows = wuTopLevelInfo.map(wu =>{
        return {
          applicationId,
          wuId: wu.Wuid,
          wuState: wu.State,
          monitoringId,
          date: startTime,
          wuTopLevelInfo: JSON.stringify(wu),
          wuDetailInfo: JSON.stringify(allWuInfo.find(wuInfo => wuInfo.Wuid === wu.Wuid)),
          metaData: JSON.stringify({}),
          analyzed: true
        }
      });

      // Save job Monitoring data
      await JobMonitoringData.bulkCreate(jmDataRows);
      
      parentPort && parentPort.postMessage({level: "info",text: `Fetch Workunit Info completed in ${new Date().getTime() - startTime} ms`});

    }catch(err){
      parentPort && parentPort.postMessage({level: "error", text: `Cluster reachability:  monitoring failed - ${err.message}`});
       
    }
})();