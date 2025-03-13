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
      tableName: "jobMonitoring_Data_Archive",
      timestamps: true,
      paranoid: true,
    }
  );


  // Associations
  JobMonitoringDataArchive.associate = (models) => {
    JobMonitoringDataArchive.belongsTo(models.application, {
      foreignKey: "applicationId",
      as: "application",
    });
    JobMonitoringDataArchive.belongsTo(models.jobMonitoring, {
      foreignKey: "monitoringId",
      as: "jobMonitoring",
    });
  }

  return JobMonitoringDataArchive;
};
