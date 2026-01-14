'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WorkUnit extends Model {
    static associate(models) {
      WorkUnit.belongsTo(models.Cluster, {
        foreignKey: 'clusterId',
        as: 'cluster',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  WorkUnit.init(
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
      workUnitTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      owner: {
        type: DataTypes.STRING(),
        allowNull: false,
      },
      engine: {
        allowNull: false,
        type: DataTypes.STRING(),
      },
      jobName: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      // TODO: Should we take state string or state ID for storage reduction.
      stateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(),
        allowNull: false,
      },
      protected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      // TODO: Should we take action string or action ID for storage reduction.
      action: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      actionEx: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      isPausing: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      thorLcr: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      totalClusterTime: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      executeCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      fileAccessCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      compileCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      totalCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      detailsFetchedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      exceptionsFetchedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clusterDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
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
      modelName: 'WorkUnit',
      tableName: 'work_units',
      paranoid: true,
      indexes: [
        {
          name: 'work_units_timestamp_idx',
          fields: ['workUnitTimestamp'],
        },
        {
          name: 'work_units_cluster_timestamp_idx',
          fields: ['clusterId', 'workUnitTimestamp'],
        },
        {
          name: 'work_units_owner_idx',
          fields: ['owner'],
        },
        {
          name: 'work_units_state_idx',
          fields: ['state'],
        },
        {
          name: 'work_units_details_fetched_idx',
          fields: ['detailsFetchedAt'],
        },
        {
          name: 'work_units_exceptions_fetched_idx',
          fields: ['exceptionsFetchedAt'],
        }
      ],
    }
  );

  return WorkUnit;
};
