"use strict";
module.exports = (sequelize, DataTypes) => {
  const directoryMonitoring = sequelize.define(
    "directoryMonitoring",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      cluster_id: {
        allowNull: false,
        type: DataTypes.UUID,
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
      type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      directory: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      approved: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      approvalNote: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      approvedBy: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    { paranoid: true, freezeTableName: true }
  );
  directoryMonitoring.associate = function (models) {
    // Define association here
    directoryMonitoring.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    directoryMonitoring.belongsTo(models.cluster, {
      foreignKey: "cluster_id",
    });
  };
  return directoryMonitoring;
};
