"use strict";
module.exports = (sequelize, DataTypes) => {
  const {
    timeSeriesAnalysis,
  } = require("../jobs/jobMonitoring/monitorJobsTimeSeriesAnalysis");
  const JobMonitoringData = sequelize.define(
    "jobMonitoring_Data",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "application",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      wuId: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      wuState: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "jobMonitoring",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      wuTopLevelInfo: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      wuDetailInfo: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSONB,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "jobMonitoring_Data",
      timestamps: true,
      paranoid: true,
    }
  );

  // Associations
  JobMonitoringData.associate = (models) => {
    JobMonitoringData.belongsTo(models.application, {
      foreignKey: "applicationId",
      as: "application",
    });
    JobMonitoringData.belongsTo(models.jobMonitoring, {
      foreignKey: "monitoringId",
      as: "jobMonitoring",
    });
  };

  // hooks
  JobMonitoringData.addHook("afterCreate", async (instance, options) => {
    const logger = require("../config/logger");

    //grab the last runs for analysis
    let lastRuns = await JobMonitoringData.findAll({
      where: {
        monitoringId: instance.monitoringId,
      },
      attributes: ["id", "date", "wuTopLevelInfo"],
      order: [["date", "DESC"]],
      limit: 10,
    });

    //strip current instance from last runs, don't have access to sequelize.op.ne operator so this is necessary instead of including it in query
    lastRuns = lastRuns.filter((run) => run.id !== instance.id);

    //if there are less than 2 records, we can't do time series analysis
    if (lastRuns.length < 2) {
      logger.verbose(
        "Not enough data to perform time series analysis for monitoring ID " +
          instance.monitoringId
      );
      return;
    }

    //pass last records and current run to timeSeriesAnalysisunction
    const result = timeSeriesAnalysis({ currentRun: instance, lastRuns });

    instance.metaData = result;

    logger.info("saving result: " + JSON.stringify(result));

    // save the result in metaData
    await instance.save();

    logger.info("result: " + JSON.stringify(result));

    //if result.length, then we will send an email. That will be a seperate PR.

    return;
  });
  return JobMonitoringData;
};
