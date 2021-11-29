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


// Send notification for manual jobs in a workflow and update job execution table 
exports.notifyManualJob = async (options) => {
  return new Promise(async (resolve,reject) =>{
      // Send email
      try {
       await NotificationModule.notify({
            from: process.env.EMAIL_SENDER,
            to: options.contact,
            subject: 'Manual Job - Action Required',
            html: `<p>Hello,</p>
                    <p> A job requires your attention. Please click <a href=${options.url}>here</a> to view  details</p>
                      

                    <p>
                    <b>Tombolo</b>
                    </p>`
          });  
          console.log('------------------------------------------');
          console.log(` ✉  EMAIL SENT to ${options.contact}!!!`) 
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