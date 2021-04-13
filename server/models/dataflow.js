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
    application_id: DataTypes.STRING,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    input: DataTypes.STRING,
    output: DataTypes.STRING,
    clusterId: DataTypes.UUIDV4,
    type: DataTypes.STRING
  }, {freezeTableName: true});
  dataflow.associate = function(models) {
    dataflow.hasOne(models.dataflowgraph, {
      foreignKey: {
        type: DataTypes.UUID
      }
    });

    dataflow.belongsToMany(models.file, {
      through: 'assets_dataflows',
      as: 'files',
      foreignKey: 'dataflowId',
      otherKey: 'assetId'
    });

    dataflow.belongsToMany(models.indexes, {
      through: 'assets_dataflows',
      as: 'indexes',
      foreignKey: 'dataflowId',
      otherKey: 'assetId'
    });

    dataflow.belongsToMany(models.job, {
      through: 'assets_dataflows',
      as: 'jobs',
      foreignKey: 'dataflowId',
      otherKey: 'assetId'
    });

  };
  return dataflow;
};