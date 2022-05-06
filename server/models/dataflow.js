'use strict';
module.exports = (sequelize, DataTypes) => {
  const dataflow = sequelize.define('dataflow', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    graph: DataTypes.JSON,
    application_id: DataTypes.STRING,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    input: DataTypes.STRING,
    output: DataTypes.STRING,
    clusterId: DataTypes.UUID,
    type: DataTypes.STRING,
    dataFlowClusterCredId : {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    metaData : DataTypes.JSON
  }, {paranoid: true, freezeTableName: true});
  dataflow.associate = function(models) {
    dataflow.hasOne(models.dataflow_cluster_credentials, {
      foreignKey: 'dataflow_id'
    });

  };
  return dataflow;
};