"use strict";
module.exports = (sequelize, DataTypes) => {
  const JobMonitoring = sequelize.define(
    "jobMonitoring",
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
      monitoringName: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      isActive: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      approvalStatus: {
        allowNull: false,
        type: DataTypes.ENUM("Approved", "Rejected", "Pending"),
      },
      approvedBy: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      approvedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      approverComment: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      monitoringScope: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      clusterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      jobName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      lastJobRunDetails: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      metaData: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      lastUpdatedBy: {
        allowNull: false,
        type: DataTypes.STRING,
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
      paranoid: true,
      freezeTableName: true,
    }
  );

  // Associations
  JobMonitoring.associate = function (models) {
    JobMonitoring.belongsTo(models.application, {
      foreignKey: "applicationId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    JobMonitoring.belongsTo(models.cluster, {
      foreignKey: "clusterId",
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    });

    JobMonitoring.hasMany(models.jobMonitoring_Data, {
      foreignKey: "monitoringId",
      as: "jobMonitoringData",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    JobMonitoring.hasMany(models.jobMonitoring_Data_Archive, {
      foreignKey: "monitoringId",
      as: "jobMonitoringDataArchive",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return JobMonitoring;
};