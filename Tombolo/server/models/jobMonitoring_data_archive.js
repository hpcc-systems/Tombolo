"use strict";
module.exports = (sequelize, DataTypes) => {
  const JobMonitoringDataArchive = sequelize.define(
    "jobMonitoring_Data_Archive",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      wuId: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
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
      tableName: "jobMonitoring_Data_Archive",
      timestamps: true,
      paranoid: true,
    }
  );

  return JobMonitoringDataArchive;
};
