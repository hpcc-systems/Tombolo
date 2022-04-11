const models  = require('../models');
const Cluster = models.cluster;
const Dataflow = models.dataflow;

const Job = models.job;
const NotificationModule = require('../routes/notifications/email-notification');

exports.notifyJobFailure = async ({jobId, clusterId, wuid}) => {
  return new Promise(async (resolve,reject) =>{
    Job.findOne({where: {id: jobId}}).then(async (job) => {     
      if(job.contact) {
        let cluster = await Cluster.findOne({where: {id: clusterId}});
        await NotificationModule.notify({
          from: process.env.EMAIL_SENDER,
          to: job.contact,
          subject:`${job.name} Failed`,
          html: `<p>Job "${job.name}" failed on "${cluster.name}" cluster</p>
                 <p> Workunit Id:
                   <a href="${cluster.thor_host}:${cluster.thor_port}/?Wuid=${wuid}&Widget=WUDetailsWidget">${wuid || "N/A" } </a>
                 </p>`
        })
        console.log('------------------------------------------');
        console.log(`!!!EMAIL SENT to ${job.contact}!!!`)
        console.log('------------------------------------------');
      }
      resolve();
    }).catch(reject);
  })
}


// Send notification for manual jobs in a workflow
exports.notifyManualJob = async (options) => {
  return new Promise(async (resolve,reject) =>{
      try {
       await NotificationModule.notify({
            from: process.env.EMAIL_SENDER,
            to: options.manualJob_meta.notifiedTo,
            subject: 'Manual Job - Action Required',
            html: `<p>Hello,</p>
                    <p> A job requires your attention. Please click <a href=${options.url}>here</a> to view  details</p>
                    <p>
                    <b>Tombolo</b>
                    </p>`
          });  
          console.log('------------------------------------------');
          console.log(` ✉  EMAIL SENT to ${options.manualJob_meta.notifiedTo}!!!`) 
          console.log('------------------------------------------');
        resolve(); 
      } catch (error) {
        reject(error)
      }
    })
}

// Send notification for manual jobs in a workflow and update job execution table 
exports.confirmationManualJobAction = async (options) => {
  const {notifiedTo, response, jobName} = options;
  return new Promise(async (resolve,reject) =>{
      try {
       await NotificationModule.notify({
            from: process.env.EMAIL_SENDER,
            to: notifiedTo,
            subject: 'Confirmation - Manual job action taken',
            html: `<p>Hello,</p>
                    <p> Your response for <b>${jobName}</b> has been recorded as <b>${response}</b>.<p>
                    <b>Tombolo</b>`
          });  
          console.log('------------------------------------------');
          console.log(` ✉ EMAIL CONFIRMATION OF ACTION TAKEN FOR MANUAL JOB  SENT TO -  ${notifiedTo}!!!`) 
          console.log('------------------------------------------');
        resolve(); 
      } catch (error) {
        reject(error)
      }
    })
}


exports.notifyDependentJobsFailure = async ({contact, dataflowId, failedJobsList}) => {
 try{
   const dataflow = await Dataflow.findOne({where: {id: dataflowId}});
   await NotificationModule.notify({
     from: process.env.EMAIL_SENDER,
     to: contact,
     subject:"Failed to execute dependent job",
     html: `<p>Failed to execute dependent job/s in "${dataflow.title}" dataflow:</p>
            ${failedJobsList.map(job=>{
              return `<p>${job.jobName}</p>`
            }).join(",")}`            
   })
    console.log('------------------------------------------');
    console.log(`!!!EMAIL SENT to ${contact}!!!`)
    console.log('------------------------------------------');
 } catch (error){
    console.log('------------------------------------------');
    console.dir(error, { depth: null });
    console.log('------------------------------------------');
 }
}

//Send job execution status (success / failure) notification, if user has subscribed
exports.notifyJobExecutionStatus = async ({ jobId, clusterId, WUstate, wuURL, message, workFlowURL }) => {
  const logNotificationStatus = (recipients, jobName, workUnitStatus, clusterName) => {
    console.log('------------------------------------------');
    console.log(`✉ notifying ${recipients}  about ${jobName} job execution '${workUnitStatus}' status on ${clusterName} cluster`);
    console.log('------------------------------------------');
  };
  return new Promise(async (resolve, reject) => {
    Job.findOne({ where: { id: jobId } })
      .then(async (job) => {
        if (!job) {
          console.log('------------------------------------------');
          console.log(`Unable to notify user - Job with id ${jobId} notFound`);
          console.log('------------------------------------------');
        } else if (job && job.metaData.notificationSettings?.notify) {
          let cluster = await Cluster.findOne({ where: { id: clusterId } });
          let notify = job.metaData.notificationSettings.notify;
          if (notify === 'Always' && WUstate !== 'not submitted' ) {
            await NotificationModule.notify({
              from: process.env.EMAIL_SENDER,
              to: job.metaData.notificationSettings.recipients,
              subject: `${job.name} ${WUstate} on ${cluster.dataValues.name} cluster`,
              html: `<p> ${WUstate === 'failed' ? job.metaData.notificationSettings.failureMessage : job.metaData.notificationSettings.successMessage} </p>
                     ${ workFlowURL ? `<p>To view workflow execution details in Tombolo, please click here <a href="${workFlowURL}"> here </a></p>` : ''}
                     <p>To view details in HPCC , please click <a href = '${wuURL}'> here </a></p>
                    <p>Tombolo</p>`,
            });
            logNotificationStatus(job.metaData.notificationSettings.recipients, job.name, WUstate, cluster.dataValues.name);
          } else if (notify === 'Only on success' && WUstate === 'completed') {
            await NotificationModule.notify({
              from: process.env.EMAIL_SENDER,
              to: job.metaData.notificationSettings.recipients,
              subject: `${job.name} ${WUstate} on ${cluster.dataValues.name} cluster`,
              html: `<p>  ${job.metaData.notificationSettings.successMessage} </p><p>Tombolo</p>`,
            });
            logNotificationStatus(job.metaData.notificationSettings.recipients, job.name, WUstate, cluster.dataValues.name);
          } else if ((notify === 'Only on failure' && WUstate === 'failed')) {
            await NotificationModule.notify({
              from: process.env.EMAIL_SENDER,
              to: job.metaData.notificationSettings?.recipients || job.contact,
              subject: `${job.name} ${WUstate} on ${cluster.dataValues.name} cluster`,
              html: `<p>  ${job.metaData.notificationSettings.failureMessage} </p>
                     <p>To view workflow execution details in Tombolo, please click here <a href="${workFlowURL}"> here </a></p>
                     <p>To view details in HPCC , please click <a href = '${wuURL}'> here </a></p>
                     <p>Tombolo</p>`,
            });
            logNotificationStatus(job.metaData.notificationSettings.recipients, job.name, WUstate, cluster.dataValues.name);
          }
          else if (((notify === 'Only on failure' || notify === 'Always') && WUstate === 'not submitted')) {
            await NotificationModule.notify({
              from: process.env.EMAIL_SENDER,
              to: job.metaData.notificationSettings?.recipients || job.contact,
              subject: `${job.name} ${WUstate} on ${cluster.dataValues.name} cluster`,
              html: `<p>  ${job.metaData.notificationSettings.failureMessage} </p>
                    <p> Error occurred while submitting a Job </p>
                    <p style="color : red">${message || ''}</p>
                    <p>Tombolo</p>`,
            });
            logNotificationStatus(job.metaData.notificationSettings.recipients, job.name, WUstate, cluster.dataValues.name);
          }  
          else {
            console.log('------------------------------------------');
            console.log(`Not subscribed for '${WUstate}' Job Execution status for ${job.name}`);
            console.log('------------------------------------------');
          }
        }
        resolve();
      })
      .catch(reject);
  });
};

exports.notifyWorkflowExecutionStatus = async ({hpccURL,executionStatus,dataflowName,dataflowId,clusterName,appId,success_message, failure_message, recipients, jobExecutionGroupId, errorMessage, jobName}) => {
  let message;
  let subject;
  //Email body
  switch(executionStatus){
    case 'completed' :
        message = `<div>
                        <p> Hello, </p>
                        <p> ${success_message } </p>
                        <p> To view workflow execution details in Tombolo please click <a href="${process.env.WEB_URL}/${appId}/dataflowinstances/dataflowInstanceDetails/${dataflowId}/${jobExecutionGroupId}"> here </a>
                        <p> Click <a href="${hpccURL}"> here </a>to view execution  details in HPCC</p> 
                      </div>`;
                      break;
    case 'error' :
         message = `<div>
                        <p>Hello,<p>
                        <p> Below error occurred while submitting  ${jobName} </p> 
                        <p><span style="color: red">${errorMessage } </span>
                    </div>`
                    break;
    case 'failed':
        message = `<div>
                      <p>Hello , </p>
                      <p>${failure_message}</p>
                      <p> To view workflow execution details in Tombolo please click <a href="${process.env.WEB_URL}/${appId}/dataflowinstances/dataflowInstanceDetails/${dataflowId}/${jobExecutionGroupId}"> here </a>
                      <p> Click <a href="${hpccURL}"> here </a>to view execution  details in HPCC</p> 
                  </div>`
  }

  //Email subject line
  switch (executionStatus) {
    case 'completed':
       subject = `${dataflowName} execution successful`;
       break;
    case 'error' : 
       subject = `Unable to submit ${jobName} for execution`;
       break;
    case 'failed' :
      subject = `${dataflowName} Failed.`
  }

  await NotificationModule.notify({
            from: process.env.EMAIL_SENDER,
            to: recipients,
            subject: `${subject}`,
            html: `${message} <p>Tombolo</p>`,
          });
  console.log('------------------------------------------');
  console.log(`✉ ${recipients} notified of workflow status` )
  console.log('------------------------------------------');

}