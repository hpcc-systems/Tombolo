const { parentPort, workerData } = require('worker_threads');

const hpccUtil = require('../utils/hpcc-util');
const models = require('../models');
const fileMonitoring = models.fileMonitoring;

const logToConsole = (message) => parentPort.postMessage({action:"logging", data: message});
const dispatchAction = (action,data) =>  parentPort.postMessage({ action, data });

(async() =>{
    try{
        const workUnitsToMonitor = await fileMonitoring.findAll();
        //If no file to monitor, log so to the console and return
        if(workUnitsToMonitor.length === 0){
            logToConsole(`NO FILE MONITORING WITH ENABLE STATUS FOUND`); 
            return;
        }

        logToConsole(`MONITORING ${workUnitsToMonitor.length} WORKUNIT(s) FOR NEW FILES`)

        //If there are file(s) to monitor -> log so to console and check for results in HPCC
        for(i = 0; i < workUnitsToMonitor.length; i++){
            const {id, wuid, cluster_id, metaData} = workUnitsToMonitor[i];
            const wuOutput = await hpccUtil.workUnitOutput({wuid, clusterId : cluster_id});
            
            if(wuOutput.Result.Row){
                logToConsole('FOUND  FILE, CHECKING IF IT IS A NEW FILE')
                const fileDetectedAt  = wuOutput.Result.Row[0].t*1000 // This is when file monitoring wu found file
                if(metaData.lastUniqueFileReceivedAt && metaData.lastUniqueFileReceivedAt === fileDetectedAt ){ // Means no new file found
                    console.log('FILE FOUND IS NOT NEW')
                }else { // First time finding a file or file is unique
                    logToConsole('NEW FILE FOUND. MAKING NECESSARY UPDATES AND PROCEEDING WITH EXECUTING DEPENDENT JOBS')
                    await fileMonitoring.update({metaData : {...metaData, lastUniqueFileReceivedAt : fileDetectedAt }}, {where : { id, cluster_id }});
                    for(i=0; i < metaData.dataflows.length; i++){
                        dispatchAction('scheduleDependentJobs',{ dependsOnJobId: id, dataflowId: metaData.dataflows[i]}); 
                    }
                }
                // const fileReceivedTime  = Date.now() - wuOutput.Result.Row[0].t*1000 // ex -> 50000 MS ago

                // Dispatch action to execute dependent job
                // if(fileReceivedTime >= 900000){ // if the file was received before 15 minutes -> its a old file.
                //      dispatchAction('scheduleDependentJobs',{ dependsOnJobId: id, dataflowId: dataflow_id}); 
                // }
             }else{
                logToConsole('NO FILE FOUND. THE RESULT ROW IS EMPTY !!')
             }}
            }catch(err){
            logToConsole(err)
    }
})()