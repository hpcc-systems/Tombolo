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

    dataflow.hasMany(models.file, {
      foreignKey: {
        type: DataTypes.UUID
      }
    });

    dataflow.hasMany(models.indexes, {
      foreignKey: {
        type: DataTypes.UUID
      }
    });

    dataflow.hasMany(models.job, {
      foreignKey: {
        type: DataTypes.UUID
      }
    });

  };
  return dataflow;
};