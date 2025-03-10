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
      metaData: {
        allowNull: false,
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
  JobMonitoringData.associate = function (models) {
    JobMonitoringData.belongsTo(models.application, {
      foreignKey: "jobMonitoring",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };
  JobMonitoringData.addHook("afterCreate", async (instance, options) => {
    //grab the last runs for analysis
    const lastRuns = await JobMonitoringData.findAll({
      where: {
        monitoringId: instance.monitoringId,
        id: !instance.id,
      },
      attributes: ["date", "metaData"],
      order: [["date", "DESC"]],
      limit: 5,
    });

    //if there are less than 2 records, we can't do time series analysis
    if (lastRuns.length < 2) {
      logger.verbose(
        "Not enough data to perform time series analysis for monitoring ID " +
          instance.monitoringId
      );
      return;
    }
    //pass last 5 records and current run to timeSeriesAnalysisunction
    const result = timeSeriesAnalysis({ currentRun: instance, lastRuns });

    //check if result is indicating an alert
    const notificationQueue = require("../models/notificationQueue");
  });

  return JobMonitoringData;
};
