'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WorkUnitDetails extends Model {
    static associate(models) {
      WorkUnitDetails.belongsTo(models.Cluster, {
        foreignKey: 'clusterId',
        as: 'cluster',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      WorkUnitDetails.belongsTo(models.WorkUnit, {
        foreignKey: 'wuId',
        as: 'workUnit',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  WorkUnitDetails.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
      },
      clusterId: {
        type: DataTypes.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      wuId: {
        type: DataTypes.STRING(30),
        references: {
          model: 'work_units',
          key: 'wuId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      scopeId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      scopeName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      scopeType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      properties: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      // TODO: Does noAccess matter
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
      modelName: 'WorkUnitDetails',
      tableName: 'work_unit_details',
      paranoid: true,
      indexes: [
        {
          name: 'work_unit_details_cluster_wu_idx',
          fields: ['clusterId', 'wuId'],
        },
        {
          name: 'work_unit_details_scope_type_idx',
          fields: ['scopeType'],
        },
        {
          name: 'work_unit_details_scope_name_idx',
          fields: ['scopeName'],
        },
        {
          name: 'work_unit_details_scope_id_idx',
          fields: ['scopeId'],
        },
      ],
    }
  );

  return WorkUnitDetails;
};
