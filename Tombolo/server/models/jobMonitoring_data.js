"use strict";
module.exports = (sequelize, DataTypes) => {
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
  }
  return JobMonitoringData;
};
