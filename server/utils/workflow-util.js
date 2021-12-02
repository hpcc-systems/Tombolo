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
        resolve();
      }
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