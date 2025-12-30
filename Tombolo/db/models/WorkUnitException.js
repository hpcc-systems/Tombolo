'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WorkunitException extends Model {
    static associate(models) {
      WorkunitException.belongsTo(models.Cluster, {
        foreignKey: 'clusterId',
        as: 'cluster',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  WorkunitException.init(
    {
      wuId: {
        primaryKey: true,
        type: DataTypes.STRING(30),
      },
      clusterId: {
        primaryKey: true,
        type: DataTypes.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      severity: {
        type: DataTypes.STRING(20),
      },
      source: {
        allowNull: true,
        type: DataTypes.STRING(40),
      },
      code: {
        type: DataTypes.INTEGER,
      },
      message: {
        allowNull: true,
        type: DataTypes.STRING(200),
      },
      column: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      lineNo: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      fileName: {
        allowNull: true,
        type: DataTypes.STRING(210),
      },
      activity: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      scope: {
        allowNull: true,
        type: DataTypes.STRING(210),
      },
      priority: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      cost: {
        allowNull: true,
        type: DataTypes.FLOAT,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'WorkUnitException',
      tableName: 'work_unit_exceptions',
      updatedAt: false,
      paranoid: true,
      rowFormat: 'COMPRESSED',
      keyBlockSize: 8,
      indexes: [],
    }
  );

  return WorkunitException;
};
