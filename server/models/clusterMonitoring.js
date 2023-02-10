"use strict";
module.exports = (sequelize, DataTypes) => {
  const clusterMonitoring = sequelize.define(
    "clusterMonitoring",
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
        allowNull: true,
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
  clusterMonitoring.associate = function (models) {
    // Define association here
    clusterMonitoring.belongsTo(models.cluster, { foreignKey: "cluster_id" });
    clusterMonitoring.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    clusterMonitoring.hasMany(models.filemonitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };
  return clusterMonitoring;
};
