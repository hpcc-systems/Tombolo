"use strict";
module.exports = (sequelize, DataTypes) => {
  const cluster = sequelize.define(
    "cluster",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thor_host: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thor_port: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roxie_host: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roxie_port: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timezone_offset: {
        type: DataTypes.INTEGER,
        allowNull: true, // TODO Must be changed to false once we are able to get default engine for containerized cluster
      },
      defaultEngine: {
        type: DataTypes.STRING,
        defaultValue: "hthor", // TODO Must be allowNull - false &&& no default value  once we are able to get default engine for containerized cluster
      },
      accountMetaData: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      metaData: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
    },
    { paranoid: true, freezeTableName: true }
  );
  cluster.associate = function (models) {
    // associations can be defined here
    cluster.hasMany(models.dataflow, { foreignKey: "clusterId" });
    cluster.hasMany(models.job, { foreignKey: "cluster_id" });
    cluster.hasMany(models.job_execution, { foreignKey: "clusterId" });
    cluster.hasMany(models.dataflow_cluster_credentials, {
      foreignKey: "cluster_id",
    });
    cluster.hasMany(models.visualizations, {
      foreignKey: "clusterId",
      onDelete: "CASCADE",
    });
    cluster.hasMany(models.fileTemplate, {
      foreignKey: "cluster_id",
      onDelete: "CASCADE",
    });
    cluster.hasMany(models.fileMonitoring, {
      foreignKey: "cluster_id",
      onDelete: "CASCADE",
    });
    cluster.hasMany(models.directoryMonitoring, {
      foreignKey: "cluster_id",
      onDelete: "CASCADE",
    });
  };
  return cluster;
};
