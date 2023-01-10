'use strict';
module.exports = (sequelize, DataTypes) => {
  const fileMonitoring = sequelize.define(
    "fileMonitoring",
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
      monitoringAssetType: {
        type: DataTypes.STRING, // landingZoneFile|| logicalFile || landingZoneFileWithTemplate
        allowNull: false,
      },
      wuid: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      fileTemplateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      cluster_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      monitoringActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
    },
    { paranoid: true, freezeTableName: true }
  );
  fileMonitoring.associate = function(models) {
    // Define association here
    fileMonitoring.belongsTo(models.fileTemplate, { foreignKey: 'fileTemplateId' });
    fileMonitoring.belongsTo(models.cluster, { foreignKey: 'cluster_id' });
    fileMonitoring.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    fileMonitoring.hasMany(models.filemonitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };
  return fileMonitoring;
};
