'use strict';

const { Model } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = (sequelize, DataTypes) => {
  class FileMonitoring extends DeleteMixin(Model) {
    static associate(models) {
      FileMonitoring.belongsTo(models.FileTemplate, {
        foreignKey: 'fileTemplateId',
      });

      FileMonitoring.belongsTo(models.Cluster, { foreignKey: 'cluster_id' });

      FileMonitoring.belongsTo(models.Application, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      FileMonitoring.hasMany(models.monitoring_notifications, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      FileMonitoring.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      FileMonitoring.belongsTo(models.user, {
        foreignKey: 'updatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      FileMonitoring.belongsTo(models.user, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  FileMonitoring.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cron: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      monitoringAssetType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      monitoringActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      wuid: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
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
      modelName: 'FileMonitoring',
      tableName: 'file_monitorings',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['name', 'deletedAt'],
          name: 'file_mon_unique_name_deleted_at',
        },
      ],
    }
  );

  return FileMonitoring;
};
