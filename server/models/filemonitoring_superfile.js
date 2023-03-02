"use strict";
module.exports = (sequelize, DataTypes) => {
  const fileMonitoring_superfiles = sequelize.define(
    "filemonitoring_superfiles",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      clusterid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      cron: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      monitoringActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      wuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    { paranoid: true, freezeTableName: true }
  );
  fileMonitoring_superfiles.associate = function (models) {
    // Define association here
    fileMonitoring_superfiles.belongsTo(models.cluster, {
      foreignKey: "clusterid",
    });
    fileMonitoring_superfiles.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    fileMonitoring_superfiles.hasMany(models.filemonitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };
  return fileMonitoring_superfiles;
};
