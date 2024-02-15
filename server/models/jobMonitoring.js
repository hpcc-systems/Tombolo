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
      },
      monitoringName: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      isActive: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      approvalStatus:{
        allowNull: false,
        type: DataTypes.ENUM("Approved", "Rejected", "Pending"),
      },
      approvedBy: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      approvedAt:{
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
  };

  return JobMonitoring;
};