const models  = require('../models');
const Cluster = models.cluster;
const Job = models.job;
const NotificationModule = require('../routes/notifications/email-notification');

exports.notifyJobFailure = (fileName, clusterId, wuid) => {
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
    }
  })
}