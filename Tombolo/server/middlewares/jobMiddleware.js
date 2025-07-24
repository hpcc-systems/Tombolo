const {
  uuidBody,
  bodyUuids,
  regexBody,
  queryUuids,
  uuidQuery,
  objectBody,
} = require('./commonMiddleware');

const sharedRegex = /^[a-zA-Z]{1}[a-zA-Z0-9_. \-:]*$/;

const validateJobFileRetention = [
  uuidBody('jobId', true, { checkFalsy: true }),
  uuidBody('dataflowId', true, { checkFalsy: true }),
];

const validateSyncDataFlow = [uuidBody('dataflowId'), bodyUuids.application_id];

const validateSaveJob = [
  uuidBody('id', true, { checkFalsy: true }),
  uuidBody('job.basic.application_id'),
  regexBody('job.basic.name', false, {
    regex: sharedRegex,
  }),
  regexBody('job.basic.title', false, {
    regex: sharedRegex,
  }),
];

const validateJobList = [queryUuids.application_id, queryUuids.cluster_id];

const validateJobDetails = [
  queryUuids.app_id,
  queryUuids.job_id,
  uuidQuery('dataflow_id', true, { checkFalsy: true }),
];

const validateDeleteJob = [bodyUuids.application_id, uuidBody('jobId')];

const validateExecuteJob = [
  uuidBody('clusterId', true, { checkFalsy: true }),
  bodyUuids.jobId,
  bodyUuids.applicationId,
  uuidBody('dataflowId', true, { checkFalsy: true }),
  regexBody('jobName', false, { regex: sharedRegex }),
];

const validateJobExecutionDetails = [
  queryUuids.dataFlowId,
  queryUuids.applicationId,
];

const validateManualJobResponse = [
  uuidBody('jobExecutionId'),
  objectBody('manualJob_metadata'),
];

module.exports = {
  validateJobFileRetention,
  validateSyncDataFlow,
  validateSaveJob,
  validateJobList,
  validateJobDetails,
  validateDeleteJob,
  validateExecuteJob,
  validateJobExecutionDetails,
  validateManualJobResponse,
};
