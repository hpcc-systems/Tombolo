const Bree = require('bree');

const db = require('./models');

const request = require('request-promise');

class JobScheduler {
  constructor() {
    this.bree = new Bree({ root: false });
    (async () => {
      console.log('running JobScheduler bootstrap...');
      await this.bootstrap();
    })();
  }

  async bootstrap() {
    await this.scheduleActiveCronJobs();
  }

  async scheduleCheckForJobsWithSingleDependency() {
    const query = `SELECT j1.id, j1.name, count(*) as count
      FROM tombolo.dependent_jobs dj
      left join job j1 on j1.id = dj.jobId
      left join job j2 on j2.id = dj.dependsOnJobId
      group by dj.jobId
      having count = 1
      order by d.updatedAt desc
      ;`;

    const jobs = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    jobs.forEach(async job => {
      //this.bree.add({ });
    });
  }

  async scheduleActiveCronJobs() {
    const query = `SELECT ad.id, c.thor_host, c.thor_port, j.name, ad.cron
      FROM tombolo.assets_dataflows ad
      left join dataflow d on d.id = ad.dataflowId
      left join job j on j.id = ad.assetId
      left join cluster c on c.id = d.clusterId
      where ad.cron IS NOT NULL
      order by d.updatedAt desc
      ;`;

    const jobs = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    jobs.forEach(async job => {
      console.log(`
        fetch WU id from ${job.thor_host}:${job.thor_port}/WsWorkunits/WUQuery.json for job name: ${job.name}
        add job to bree { name: ${job.name}, cron: ${job.cron}, path: ..., workerData: {workunitId: $WUID, cluster: ${job.thor_host}, ...} }
      `);
      try {
        let response = await request({
          method: 'POST',
          uri: `${job.thor_host}:${job.thor_port}/WsWorkunits/WUQuery.json`,
          body: {
           "WUQuery": {
             "Jobname": job.name
           }
          },
          json: true,
          headers: { 'Content-Type': 'application/json' },
          resolveWithFullResponse: true
        });
        console.log(response.body);
      } catch (err) {
        console.log(err);
      }
    });
  }
}

module.exports = new JobScheduler();