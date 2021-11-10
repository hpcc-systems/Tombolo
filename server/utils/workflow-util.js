const models  = require('../models');
const Cluster = models.cluster;
const Job = models.job;
const NotificationModule = require('../routes/notifications/email-notification');

exports.notifyJobFailure = async (jobName, clusterId, wuid) => {
  try {
    return new Promise((resolve, reject) => {
      Job.findOne({where: {name: jobName}, attributes: {exclude: ['assetId']}}).then(async (job) => {

        if(job.contact && job.contact != '') {
          let cluster = await Cluster.findOne({where: {id: job.cluster_id}});
          NotificationModule.notify({
            from: process.env.EMAIL_SENDER,
            to: job.contact,
            subject: job.name + ' Failed',
            html: '<p>Job "'+job.name+'" failed on "'+cluster.name+'" cluster</p>' +
              '<p>Workunit Id: <a href="'+cluster.thor_host + ':' + cluster.thor_port + '/?Wuid='+wuid+'&Widget=WUDetailsWidget">'+wuid+'</a></p>'
          })
        }

        resolve();
      }).catch((err) => {
        reject(err);
      })
  
    })
  }catch (err) {
    console.log(err);
  }
}