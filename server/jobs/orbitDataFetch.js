const { parentPort, workerData } = require("worker_threads");

const hpccUtil = require("../utils/hpcc-util");

const logger = require("../config/logger");
const models = require("../models");
const application = require("../models/application");
const plugins = require("../models/plugins");

const { log, dispatch } = require("./workerUtils")(parentPort);

async () => {
  try {
    //grab all orbit plugins that are active
    const orbitPlugins = await plugins.findAll({
      where: {
        name: "Orbit",
        active: true,
      },
    });

    if (orbitPlugins) {
      //if there are active plugins, grab new data and send notifications

      orbitPlugins.map(async (plugin) => {
        const connectionString =
          "server=ALAWDSQL201.RISK.REGN.NET,50265;Database=ORBITReport;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
        const query =
          "select TOP 5 * from DimBuildInstance where SubStatus_Code = 'MEGAPHONE' order by DateUpdated desc";
        sql.query(connectionString, query, (err, rows) => {
          if (!err) {
            rows.map(async (build) => {
              let orbitBuild = await orbitBuilds.findOne({
                where: {
                  build_id: build.BuildInstanceIdKey,
                  application_id: application_id,
                },
                raw: true,
              });

              if (!orbitBuild) {
                await orbitBuilds.create({
                  application_id: application_id,
                  build_id: build.BuildInstanceIdKey,
                  name: build.Name,
                  metaData: {
                    lastRun: build.DateUpdated,
                    status: build.Status_Code,
                    subStatus: build.SubStatus_Code,
                    workunit: build.HpccWorkUnit,
                    EnvironmentName: build.EnvironmentName,
                    Template: build.BuildTemplate_Name,
                  },
                });
              }
            });
          }
        });
      });
    } else {
      logger.info("No active Orbit Plugins found.");
    }
  } catch (error) {
    logger.error("Error while running Orbit Jobs: " + error);
  }
};
