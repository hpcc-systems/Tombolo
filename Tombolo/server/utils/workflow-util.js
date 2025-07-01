const logger = require('../config/logger');
const { cluster: Cluster, dataflow: Dataflow, job: Job } = require('../models');

const NotificationModule = require('../routes/notifications/email-notification');

// Send notification for manual jobs in a workflow
exports.notifyManualJob = async options => {
  return new Promise(async (resolve, reject) => {
    try {
      await NotificationModule.notify({
        from: process.env.EMAIL_SENDER,
        to: options.manualJob_meta.notifiedTo,
        subject: 'Manual Job - Action Required',
        html: `<p>Hello,</p>
                    <p> A job requires your attention. Please click <a href=${options.url}>here</a> to view  details</p>
                    <p>
                    <b>Tombolo</b>
                    </p>`,
      });
      logger.info('------------------------------------------');
      logger.info(` ✉  EMAIL SENT to ${options.manualJob_meta.notifiedTo}!!!`);
      logger.info('------------------------------------------');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Send notification for manual jobs in a workflow and update job execution table
exports.confirmationManualJobAction = async options => {
  const { notifiedTo, response, jobName } = options;
  return new Promise(async (resolve, reject) => {
    try {
      await NotificationModule.notify({
        from: process.env.EMAIL_SENDER,
        to: notifiedTo,
        subject: 'Confirmation - Manual job action taken',
        html: `<p>Hello,</p>
                    <p> Your response for <b>${jobName}</b> has been recorded as <b>${response}</b>.<p>
                    <b>Tombolo</b>`,
      });
      logger.info('------------------------------------------');
      logger.info(
        ` ✉ EMAIL CONFIRMATION OF ACTION TAKEN FOR MANUAL JOB  SENT TO -  ${notifiedTo}!!!`
      );
      logger.info('------------------------------------------');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

exports.notifyWorkflow = async ({
  dataflowId,
  jobExecutionGroupId,
  status,
  jobName = '',
  wuid = '',
  exceptions = '',
}) => {
  if (!dataflowId) return null;

  const dataflow = await Dataflow.findOne({
    where: { id: dataflowId },
    include: Cluster,
  });
  if (!dataflow) return null;

  const { application_id, cluster } = dataflow;

  const notification = dataflow?.metaData?.notification;
  if (!notification) return null;

  const { notify, failure_message, success_message, recipients } = notification;

  const DATAFLOW_LINK = `${process.env.WEB_URL}/${application_id}/dataflowinstances/dataflowInstanceDetails/${dataflowId}/${jobExecutionGroupId}`;
  const FAILED_HPCC_URL = `${cluster.thor_host}:${cluster.thor_port}/?Wuid=${wuid}&Widget=WUDetailsWidget`;
  const SUCCESS_HPCC_URL = `${cluster.thor_host}:${cluster.thor_port}/#/stub/ECL-DL/Workunits-DL/Workunits`;

  const statuses = {
    failure: ['wait', 'blocked', 'failed', 'error', 'fileMonitoringFailure'],
    success: ['compiled', 'completed'],
  };

  if (!notify || notify === 'Never') return null; // notifications settings on dataflow level is not provided
  if (notify === 'Only on failure' && !statuses.failure.includes(status))
    return null;
  if (notify === 'Only on success' && !statuses.success.includes(status))
    return null;

  const email = {
    subject: 'Tombolo',
    message: '',
  };

  const action = {
    completed: () => {
      email.subject = `${dataflow.title} execution successful`;
      email.message = `<div>
          <p> Hello, </p>
          <p> ${success_message} </p>
          <p> To view workflow execution details in Tombolo please click <a href=${DATAFLOW_LINK}> here </a>
          <p> Click <a href="${SUCCESS_HPCC_URL}"> here </a>to view execution details in HPCC</p> 
        </div>`;
    },
    error: () => {
      email.subject = `Unable to submit ${jobName} for execution`;
      email.message = `<div>
          <p>Hello,<p>
          <p>Below error occurred while submitting ${jobName}</p> 
          <p><span style="color: red">${exceptions}</span>
        </div>`;
    },
    failed: () => {
      email.subject = `${dataflow.title} Failed.`;
      email.message = `<div>
          <p>Hello, </p>
          <p>${failure_message}</p>
          <p> To view workflow execution details in Tombolo please click <a href=${DATAFLOW_LINK}> here </a>
          <p> Click <a href="${FAILED_HPCC_URL}"> here </a>to view execution  details in HPCC</p> 
        </div>`;
    },
    fileMonitoringFailure: () => {
      email.subject = `Failed to trigger ${dataflow.title} execution - File Monitoring Failure`;
      email.message = `<div>
          <p>Hello, </p>
          <p>${failure_message}</p>
          <p>${jobName} failed. Jobs that depend on this file monitoring won't be executed. Click <a href="${FAILED_HPCC_URL}"> here </a>to view file monitoring details in HPCC</p> 
        </div>`;
    },
  };

  if (action[status]) action[status]();

  await NotificationModule.notify({
    to: recipients,
    subject: email.subject,
    from: process.env.EMAIL_SENDER,
    html: `${email.message} <p>Tombolo</p>`,
  });

  logger.info('------------------------------------------');
  logger.info(`✉ ${recipients} notified of workflow status = ${status}`);
  logger.info('------------------------------------------');
};

exports.notifyJob = async ({
  jobId,
  status,
  wuid = '',
  dataflowId = '',
  jobExecutionGroupId = '',
  exceptions = '',
}) => {
  if (dataflowId) {
    // if Job is Executed in Dataflow and it has Dataflow notification level, then skip Job level notification;
    const dataflow = await Dataflow.findOne({ where: { id: dataflowId } });
    if (dataflow?.metaData?.notification?.notify !== 'Never') return null;
  }

  const job = await Job.findOne({ where: { id: jobId }, include: Cluster });
  if (!job) return null;

  const { cluster, application_id, metaData } = job;
  const notification = metaData?.notificationSettings;
  if (!notification) return null;

  const { notify, recipients, failureMessage, successMessage } = notification;

  const HPCC_URL = `${cluster.thor_host}:${cluster.thor_port}/?Wuid=${wuid}&Widget=WUDetailsWidget`;
  const DATAFLOW_LINK = `${process.env.WEB_URL}/${application_id}/dataflowinstances/dataflowInstanceDetails/${dataflowId}/${jobExecutionGroupId}`;

  const statuses = {
    failure: ['wait', 'blocked', 'failed', 'error'],
    success: ['compiled', 'completed'],
  };

  if (!notify || notify === 'Never') return null; // notifications settings on job level is not provided
  if (notify === 'Only on failure' && !statuses.failure.includes(status))
    return null;
  if (notify === 'Only on success' && !statuses.success.includes(status))
    return null;

  const email = {
    subject: 'Tombolo',
    message: '',
  };

  const action = {
    completed: () => {
      email.subject = `"${job.name}" execution successful`;
      email.message = `<div>
          <p> Hello, </p>
          <p> ${successMessage} </p>
          ${!dataflowId ? '' : `<p> To view workflow execution details in Tombolo please click <a href="${DATAFLOW_LINK}"> here </a></p>`}
          <p> Click <a href="${HPCC_URL}"> here </a>to view execution details in HPCC</p> 
        </div>`;
    },
    error: () => {
      email.subject = `Unable to submit ${job.name} for execution`;
      email.message = `<div>
          <p>Hello,<p>
          <p>Below error occurred while submitting ${job.name}</p> 
          <p><span style="color: red">${exceptions}</span>
        </div>`;
    },
    failed: () => {
      email.subject = `Failed to execute "${job.name}": ${status} on "${cluster.name}" cluster`;
      email.message = `<div>
        <p>Hello, </p>
        <p>${failureMessage}</p>
        ${!dataflowId ? '' : `<p> To view workflow execution details in Tombolo please click <a href="${DATAFLOW_LINK}"> here </a>`}
        <p> Click <a href="${HPCC_URL}"> here </a>to view execution  details in HPCC</p> 
      </div>`;
    },
  };

  // Call action depending on status to update email object that is used in email itself.
  if (action[status]) action[status]();

  await NotificationModule.notify({
    to: recipients,
    subject: email.subject,
    from: process.env.EMAIL_SENDER,
    html: `${email.message} <p>Tombolo</p>`,
  });

  logger.info('------------------------------------------');
  logger.info(
    `✉ ${recipients} notified of "'${job.name}" status :"${status}"`
  );
  logger.info('------------------------------------------');
};
