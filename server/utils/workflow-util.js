const models  = require('../models');
const Cluster = models.cluster;
const Job = models.job;
const NotificationModule = require('../routes/notifications/email-notification');

exports.notifyJobFailure = ({jobId, clusterId, wuid}) => {
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