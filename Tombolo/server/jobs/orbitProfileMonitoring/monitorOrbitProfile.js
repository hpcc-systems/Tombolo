const { logOrPostMessage } = require('../jobUtils');
const { OrbitProfileMonitoring } = require('../../models');

const {
  runMySQLQuery,
  orbitDbConfig,
} = require('../../utils/runSQLQueries.js');

async function monitorOrbitProfile() {
  try {
    logOrPostMessage({
      level: 'info',
      text: 'Orbit monitoring running message ..',
    });

    // Get all active Orbit Profile Monitoring
    const activeOrbitProfiles = await OrbitProfileMonitoring.findAll({
      where: { isActive: true },
      raw: true,
    });

    const safeParse = s => {
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    };

    let builds = activeOrbitProfiles
      .map(m => {
        let md = m.metaData;
        if (typeof md === 'string') md = safeParse(md);
        const raw = md?.asrSpecificMetaData?.buildName;
        if (raw === undefined || raw === null) return null;
        // normalize: stringify, trim, remove surrounding quotes
        let name = String(raw).trim();
        name = name.replace(/^['"]+|['"]+$/g, '').trim();
        return name;
      })
      .filter(b => b !== undefined && b !== null && b !== '');

    // dedupe builds
    builds = [...new Set(builds)];

    if (!builds || builds.length === 0) {
      logOrPostMessage({
        level: 'info',
        text: 'No builds found for active orbit profiles, exiting.',
      });
      return [];
    }

    // Build parameter placeholders for prepared IN clause and params array
    const placeholders = builds.map(() => '?').join(',');
    const params = builds;

    // Look up map for build with monitoring IDs
    const buildToMonitoringMap = {};
    activeOrbitProfiles.forEach(m => {
      const buildName = m.metaData?.asrSpecificMetaData?.buildName;
      if (buildName) {
        if (!buildToMonitoringMap[buildName]) {
          buildToMonitoringMap[buildName] = [];
        }
        buildToMonitoringMap[buildName].push(m.id);
      }
    });

    logOrPostMessage({
      level: 'info',
      text: buildToMonitoringMap,
    });

    logOrPostMessage({
      level: 'info',
      text: `Prepared IN clause placeholders: ${placeholders}`,
    });
    logOrPostMessage({
      level: 'info',
      text: `Params: ${JSON.stringify(params)}`,
    });

    const query = `
      SELECT
        HpccWorkUnit AS WorkUnit,
        Name AS Build,
        DateUpdated AS Date,
        Status_Code AS Status,
        Version,
        BuildTemplateIdKey AS BuildID
      FROM orbitreport.dimbuildinstance
      WHERE Name IN (${placeholders})
        AND HpccWorkUnit IS NOT NULL
      ORDER BY Name, DateUpdated DESC;
    `;

    const wuResult = await runMySQLQuery(query, orbitDbConfig, params);

    logOrPostMessage({ level: 'info', text: JSON.stringify(wuResult) });
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `monitorOrbitProfile: ${err.message}`,
    });
  }
}

(async () => {
  await monitorOrbitProfile();
})();

module.exports = {
  monitorOrbitProfile,
};
