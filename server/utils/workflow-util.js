const models  = require('../models');
const Cluster = models.cluster;
const Job = models.job;
const NotificationModule = require('../routes/notifications/email-notification');

exports.notifyJobFailure = (jobName, clusterId) => {
  Job.findOne({where: {name: jobName}, attributes: {exclude: ['assetId']}}).then(async (job) => {
    if(job.contact && job.contact != '') {
      let cluster = await Cluster.findOne({where: {id: job.cluster_id}});
      NotificationModule.notify({
        from: process.env.EMAIL_SENDER,
        to: job.contact,
        subject: job.name + ' Failed',
        html: '<p>Job "'+job.name+'" failed on "'+cluster.name+'" cluster</p>' +
          '<p>Workunit Id: <a href="'+cluster.thor_host + ':' + cluster.thor_port + '/?Wuid='+msgJson.wuid+'&Widget=WUDetailsWidget">'+msgJson.wuid+'</a></p>'
      })
    }
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
                <p> Below job requires your attention. Please click <a href=${options.url}>Here</a> to view job details</p>
                    <p> Name : ${options.jobName}</p>
                <p>
                <b>Tombolo Team </b>
                </p>`
        
      })

      // Notification delivered in user's mailbox - add job to job_execution table with status 'wait'
      if(response.accepted){
        Job.create(options).then(job => {
          console.log('job added to job execution table with status -wait')
        })

      }
      
}
