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
        autoIncrement: false,
      },
      name: DataTypes.STRING,
      thor_host: DataTypes.STRING,
      thor_port: DataTypes.STRING,
      roxie_host: DataTypes.STRING,
      roxie_port: DataTypes.STRING,
      username: DataTypes.STRING,
      hash: DataTypes.STRING,
      timezone_offset: DataTypes.INTEGER,
      metaData: { type: DataTypes.JSON, defaultValue: {} },
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
