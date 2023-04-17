"use strict";
module.exports = (sequelize, DataTypes) => {
  const JobMonitoring = sequelize.define(
    "JobMonitoring",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      cron: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      cluster_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
    },
    { paranoid: true, freezeTableName: true }
  );
  JobMonitoring.associate = function (models) {
    // Define association here
    JobMonitoring.belongsTo(models.cluster, { foreignKey: "cluster_id" });
    JobMonitoring.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    JobMonitoring.hasMany(models.monitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };
  return JobMonitoring;
};
