"use strict";
module.exports = (sequelize, DataTypes) => {
  const orbitBuilds = sequelize.define(
    "orbitBuilds",
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
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      build_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metaData: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    },
    { paranoid: true, freezeTableName: true }
  );
  orbitBuilds.associate = function (models) {
    // Define association here
    orbitBuilds.belongsTo(models.cluster, { foreignKey: "cluster_id" });
    orbitBuilds.belongsTo(models.application, {
      foreignKey: "application_id",
    });
    orbitBuilds.hasMany(models.monitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };
  return orbitBuilds;
};
