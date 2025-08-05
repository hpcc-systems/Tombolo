'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DataflowVersion extends Model {
    static associate(models) {
      DataflowVersion.belongsTo(models.Dataflow, { foreignKey: 'dataflowId' });
      DataflowVersion.hasMany(models.job_execution, {
        foreignKey: 'dataflowVersionId',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      });
    }
  }

  DataflowVersion.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      isLive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      graph: DataTypes.JSON,
      createdBy: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      dataflowId: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: 'DataflowVersion',
      tableName: 'dataflow_versions',
      paranoid: true,
    }
  );

  return DataflowVersion;
};
