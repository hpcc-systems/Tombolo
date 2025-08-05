'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DataflowClusterCredential extends Model {
    static associate(models) {
      DataflowClusterCredential.belongsTo(models.Dataflow, {
        foreignKey: 'dataflow_id',
      });
      DataflowClusterCredential.belongsTo(models.Cluster, {
        foreignKey: 'cluster_id',
      });
    }
  }

  DataflowClusterCredential.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      dataflow_id: DataTypes.UUID,
      cluster_id: DataTypes.UUID,
      cluster_username: DataTypes.STRING,
      cluster_hash: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'DataflowClusterCredential',
      tableName: 'dataflow_cluster_credentials',
      paranoid: true,
      freezeTableName: true,
    }
  );

  return DataflowClusterCredential;
};
