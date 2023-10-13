"use strict";
module.exports = (sequelize, DataTypes) => {
  const orbitMonitoring = sequelize.define(
    "orbitMonitoring",
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
      build: {
        allowNull: false,
        type: DataTypes.STRING,
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
  orbitMonitoring.associate = function (models) {
    // Define association here
    orbitMonitoring.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    orbitMonitoring.hasMany(models.monitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };
  return orbitMonitoring;
};
