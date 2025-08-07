'use strict';

const { Model } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = (sequelize, DataTypes) => {
  class SuperfileMonitoring extends DeleteMixin(Model) {
    static associate(models) {
      SuperfileMonitoring.belongsTo(models.Cluster, {
        foreignKey: 'clusterid',
      });

      SuperfileMonitoring.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });

      SuperfileMonitoring.hasMany(models.MonitoringNotification, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      SuperfileMonitoring.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      SuperfileMonitoring.belongsTo(models.user, {
        foreignKey: 'updatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      SuperfileMonitoring.belongsTo(models.user, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  SuperfileMonitoring.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      clusterid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      cron: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      monitoringActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      wuid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      deletedBy: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'SuperfileMonitoring',
      tableName: 'superfile_monitorings',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['name', 'deletedAt'],
        },
      ],
    }
  );

  return SuperfileMonitoring;
};
