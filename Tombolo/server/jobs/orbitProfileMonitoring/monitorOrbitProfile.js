const { logOrPostMessage } = require('../jobUtils');
const { OrbitProfileMonitoring, OrbitBuildData } = require('../../models');

const {
  runMySQLQuery,
  orbitDbConfig,
} = require('../../utils/runSQLQueries.js');

async function monitorOrbitProfile() {
  const timeStarted = new Date();
  try {
    logOrPostMessage({
      level: 'info',
      text: 'Orbit monitoring - Getting new builds from Orbit server and checking if status  of existing build changed...',
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

    // Query to get all matching builds
    const query = `
      SELECT BuildInstanceIdKey, HpccWorkUnit, Name, DateUpdated, Status_Code, Version, BuildTemplateIdKey
      FROM (
        SELECT
          BuildInstanceIdKey, HpccWorkUnit, Name, DateUpdated, Status_Code, Version, BuildTemplateIdKey,
          ROW_NUMBER() OVER (PARTITION BY Name ORDER BY DateUpdated DESC) AS rn
        FROM orbitreport.dimbuildinstance
        WHERE Name IN (${placeholders})
          AND HpccWorkUnit IS NOT NULL
      ) t
      WHERE rn <= 10
      ORDER BY Name, DateUpdated DESC;
    `;

    const wuResult = await runMySQLQuery(query, orbitDbConfig, params); // Array of objects

    // Separate the build that already exist in our OrbitBuildData table -> Array of objects
    const existingBuilds = await OrbitBuildData.findAll({
      where: {
        buildInstanceIdKey: wuResult.map(wu => wu.BuildInstanceIdKey),
      },
      raw: true,
    });

    // Ids of existing builds
    const existingBuildIds = existingBuilds.map(b => b.BuildInstanceIdKey);

    // Filter out existing builds
    const newBuilds = wuResult.filter(
      wu => !existingBuildIds.includes(wu.BuildInstanceIdKey)
    );

    // Insert new builds into OrbitBuildData
    const buildDataToInsert = newBuilds.map(wu => ({
      BuildInstanceIdKey: wu.BuildInstanceIdKey,
      HpccWorkUnit: wu.HpccWorkUnit,
      Name: wu.Name,
      DateUpdated: wu.DateUpdated,
      Status_Code: wu.Status_Code,
      Version: wu.Version,
      BuildTemplateIdKey: wu.BuildTemplateIdKey,
      status_history: [
        {
          status: wu.Status_Code,
          date: wu.DateUpdated,
        },
      ],
    }));

    if (buildDataToInsert.length > 0) {
      logOrPostMessage({
        level: 'info',
        text: `Inserting ${buildDataToInsert.length} new Orbit build records.`,
      });
      await OrbitBuildData.bulkCreate(buildDataToInsert);
    }

    // Find the changed builds
    const existingBuildNeedingUpdate = [];
    for (const b of existingBuilds) {
      // Find corresponding wuResult entry
      const wu = wuResult.find(
        w => w.BuildInstanceIdKey === b.BuildInstanceIdKey
      );
      if (!wu) continue;

      // Check if the Status_Code or DateUpdated has changed0;
      if (
        b.Status_Code !== wu.Status_Code ||
        String(b.DateUpdated) !== String(wu.DateUpdated)
      ) {
        // Build payload like for the new builds , make sure to append to status_history if status changed
        const statusCodeChanged =
          b.Status_Code !== wu.Status_Code ? 'Status_Code' : null;
        const updateDateChanged =
          String(b.DateUpdated) !== String(wu.DateUpdated)
            ? 'DateUpdated'
            : null;

        const payload = { ...b };
        if (statusCodeChanged) {
          payload.Status_Code = wu.Status_Code;
          const updatedStatusHistory = [
            ...b.status_history,
            { date: wu.DateUpdated, status: wu.Status_Code },
          ];
          payload.status_history = updatedStatusHistory;
        }
        if (updateDateChanged) {
          payload.DateUpdated = wu.DateUpdated;
        }
        existingBuildNeedingUpdate.push(payload);
      }
    }

    //Loop and  Update existing builds that need update
    for (const b of existingBuildNeedingUpdate) {
      try {
        await OrbitBuildData.update(
          {
            ...b,
          },
          {
            where: { buildInstanceIdKey: b.BuildInstanceIdKey },
          }
        );
      } catch (updateErr) {
        logOrPostMessage({
          level: 'error',
          text: `Error updating Orbit build record for BuildInstanceIdKey: ${b.BuildInstanceIdKey} - ${updateErr}`,
        });
      }
    }
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `monitorOrbitProfile: ${err}`,
    });
  } finally {
    const timeEnded = new Date();
    const duration = (timeEnded - timeStarted) / 1000; // duration in seconds
    logOrPostMessage({
      level: 'info',
      text: `Checking  Orbit server for new builds and status changes completed in ${duration} seconds.`,
    });
  }
}

(async () => {
  await monitorOrbitProfile();
})();

module.exports = {
  monitorOrbitProfile,
};
