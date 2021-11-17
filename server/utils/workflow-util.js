const models  = require('../models');
const Cluster = models.cluster;
const Job = models.job;
const NotificationModule = require('../routes/notifications/email-notification');

exports.notifyJobFailure = (fileName, clusterId, wuid) => {
  return new Promise((resolve,reject) =>{
    Job.findOne({where: {name: fileName}, attributes: {exclude: ['assetId']}}).then(async (job) => {
      if(job.contact && job.contact != '') {
        let cluster = await Cluster.findOne({where: {id: clusterId}});
        NotificationModule.notify({
          from: process.env.EMAIL_SENDER,
          to: job.contact,
          subject: job.name + ' Failed',
          html: '<p>Job "'+job.name+'" failed on "'+cluster.name+'" cluster</p>' +
          '<p>Workunit Id: <a href="'+cluster.thor_host + ':' + cluster.thor_port + '/?Wuid='+wuid+'&Widget=WUDetailsWidget">'+wuid+'</a></p>'
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
  // Send email
    const response = await NotificationModule.notify({
        from: process.env.EMAIL_SENDER,
        to: options.contact,
        subject: 'Manual Job - Action Required',
        html: `<p>Hello,</p>
                <p> A job requires your attention. Please click <a href=${options.url}>Here</a> to view  details</p>
                  

                <p>
                <b>Tombolo Team </b>
                </p>`
        
      })      
}
