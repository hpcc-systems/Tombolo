const { parentPort, workerData } = require("worker_threads");
const assetUtil = require('../utils/workflow-util');
const models = require('../models')
const JobExecution = models.job_execution;


(async () => {
	console.log("Send notification ...")
	workerData.url = `${process.env.WEB_URI}${workerData.applicationId}/manualJobDetails/${workerData.jobId}`
    JobExecution.create(workerData).then(response => { assetUtil.notifyManualJob(workerData)});
})();      