const { parentPort, workerData } = require('worker_threads');

const hpccUtil = require('../utils/hpcc-util');
const workflowUtil = require('../utils/workflow-util')
const models = require('../models');
const fileMonitoring = models.fileMonitoring;
const DataflowVersions = models.dataflow_versions;

const { log, dispatch } = require('./workerUtils')(parentPort);

(async () => {
  try {
    const workUnitsToMonitor = await fileMonitoring.findAll();

    //If no file to monitor, log so to the console and return
    if (workUnitsToMonitor.length === 0) {
      log('verbose',`NO FILE MONITORING WITH ENABLE STATUS FOUND`);
      return;
    }


    log('verbose',`MONITORING ${workUnitsToMonitor.length} WORKUNIT(s) FOR NEW FILES`);

    //If there are file(s) to monitor -> log so to console and check for results in HPCC
    for (i = 0; i < workUnitsToMonitor.length; i++) {
        const { id, wuid, cluster_id, fileTemplateId,  metaData } = workUnitsToMonitor[i];

        const workUnitInfo = await hpccUtil.workunitInfo(wuid, cluster_id)
        const {Workunit} = workUnitInfo;

        if(Workunit.State === 'failed'){
            const {dataflows} = metaData
            // A file monitoring could be a part of multiple dataflows
            for(const dataflow of dataflows){
              await workflowUtil.notifyWorkflow({ wuid, dataflowId:dataflow, jobName: Workunit.Jobname, status: 'fileMonitoringFailure' });
            }
            return;
        }
        const wuOutput = await hpccUtil.workUnitOutput({ wuid, clusterId: cluster_id });

        if (wuOutput.Result.Row?.length > 0) {
          log('verbose','FOUND  FILE, CHECKING IF IT IS A NEW FILE');
          const fileDetectedAt = wuOutput.Result.Row[0].t; // This is when file monitoring wu found file
          if (metaData.lastUniqueFileReceivedAt && metaData.lastUniqueFileReceivedAt === fileDetectedAt) {
            // Means no new file found
          log('verbose','FILE FOUND IS NOT NEW');
          } else {
            // First time finding a file or file is unique
            log('info','NEW FILE FOUND. MAKING NECESSARY UPDATES AND PROCEEDING WITH EXECUTING DEPENDENT JOBS' );
            
            await fileMonitoring.update( { metaData: { ...metaData, lastUniqueFileReceivedAt: fileDetectedAt } }, { where: { id, cluster_id } } );
            
            for (i = 0; i < metaData.dataflows.length; i++) {
              const dataflowId = metaData.dataflows[i];
              // find live version to start execution
              const latestVersion = await DataflowVersions.findOne({ where:{ dataflowId, isLive: true }});
              // no live version found, moving to next dataflow
              if (!latestVersion) {
                log('info',`No Live version for dataflow ${dataflowId}} was found, cannot schedule next job.`)
                continue;
              }
              // live version found, schedule dependent job;
              dispatch('scheduleNext', {
                dataflowVersionId: latestVersion.id,
                dependsOnJobId: fileTemplateId,
                dataflowId,
              });
            }
          }

      } else {
        log('verbose','NO FILE FOUND. THE RESULT ROW IS EMPTY !!');
      }
    }
  } catch (err) {
    log("error",'Error in File Monitoring Poller', error);
  }  finally {
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
  }
})();
