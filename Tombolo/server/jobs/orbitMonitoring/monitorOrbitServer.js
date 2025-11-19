const logger = require('../../config/logger');
const { parentPort } = require('worker_threads');
const { OrbitProfileMonitoring } = require('../../models');
const {
  runMySQLQuery,
  orbitDbConfig,
} = require('../../utils/runSQLQueries.js');

const monitorOrbitServer = async () => {
  try {
    logger.info(
      'Monitoring Orbit Server - Getting list of active orbit profile monitorings...'
    );

    // Get all active orbit profile monitorings
    const activeOrbitMonitorings = await OrbitProfileMonitoring.findAll({
      where: {
        isActive: true,
      },
      raw: true,
    });

    logger.info(
      `Found ${activeOrbitMonitorings.length} active orbit profile monitoring(s)`
    );

    // Iterate over each active orbit profile monitoring, destructure asrSpecificMetaData and push to orbitProfileMonitorings array
    const allBuilds = [];
    activeOrbitMonitorings.map(m => {
      const { asrSpecificMetaData } = m.metaData;
      allBuilds.push(asrSpecificMetaData.buildName);
    });

    // run query like -     const query = `select HpccWorkUnit as 'WorkUnit', Name as 'Build', DateUpdated as 'Date', Status_Code as 'Status', Version, BuildTemplateIdKey as 'BuildID'  from DimBuildInstance where Name = '${build}' AND HpccWorkUnit IS NOT NULL order by Date desc Limit 10`; to get all the builds Name for each build is in builds array
    const query = `SELECT HpccWorkUnit AS 'WorkUnit', Name AS 'Build', DateUpdated AS 'Date', Status_Code AS 'Status', Version, BuildTemplateIdKey AS 'BuildID'  FROM DimBuildInstance WHERE Name IN (${allBuilds.map(b => `'${b}'`).join(',')}) AND HpccWorkUnit IS NOT NULL ORDER BY DateUpdated DESC LIMIT 10`;
    const wuResult = await runMySQLQuery(query, orbitDbConfig);

    // TODO - check if work unit triggers notification - if so queue it up

    parentPort.postMessage({ status: 'running' });
  } catch (error) {
    logger.error(`Error monitoring Orbit Server: ${error.message}`);
    parentPort.postMessage({ status: 'failed', error: error.message });
  }
};

(async () => {
  await monitorOrbitServer();
})();

module.exports = {
  monitorOrbitServer,
};
