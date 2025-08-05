'use strict';

const { Model, DataTypes } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = sequelize => {
  class Cluster extends DeleteMixin(Model) {
    static associate(models) {
      this.hasMany(models.dataflow, { foreignKey: 'clusterId' });
      this.hasMany(models.job, { foreignKey: 'cluster_id' });
      this.hasMany(models.job_execution, { foreignKey: 'clusterId' });
      this.hasMany(models.dataflow_cluster_credentials, {
        foreignKey: 'cluster_id',
      });
      this.hasMany(models.fileTemplate, {
        foreignKey: 'cluster_id',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.fileMonitoring, {
        foreignKey: 'cluster_id',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.directoryMonitoring, {
        foreignKey: 'cluster_id',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.landingZoneMonitoring, {
        foreignKey: 'clusterId',
        onDelete: 'NO ACTION',
      });
      this.hasMany(models.cluster_monitoring, {
        foreignKey: 'clusterId',
        onDelete: 'CASCADE',
      });

      Cluster.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      Cluster.belongsTo(models.user, {
        foreignKey: 'updatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      Cluster.belongsTo(models.user, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  Cluster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thor_host: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thor_port: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roxie_host: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roxie_port: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      defaultEngine: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      timezone_offset: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      allowSelfSigned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      containerized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      accountMetaData: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      adminEmails: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      reachabilityInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      storageUsageHistory: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      metaData: {
        type: DataTypes.JSON,
        defaultValue: {},
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
    },
    {
      sequelize,
      modelName: 'Cluster',
      tableName: 'clusters',
      paranoid: true,
    }
  );

  return Cluster;
};
