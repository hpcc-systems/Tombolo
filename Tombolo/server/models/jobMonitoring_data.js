"use strict";
const JobMonitoringData = (module.exports = (sequelize, DataTypes) => {
  const {
    timeSeriesAnalysisAndAlert,
  } = require("../jobs/jobMonitoring/monitorJobsUtil");
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
    timeSeriesAnalysisAndAlert({ data: instance });
  });

  return JobMonitoringData;
});
module.exports = JobMonitoringData;
