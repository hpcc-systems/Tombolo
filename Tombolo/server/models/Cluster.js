'use strict';

const { Model, DataTypes } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = sequelize => {
  class Cluster extends DeleteMixin(Model) {
    static associate(models) {
      this.hasMany(models.Dataflow, { foreignKey: 'clusterId' });
      this.hasMany(models.Job, { foreignKey: 'cluster_id' });
      this.hasMany(models.JobExecution, { foreignKey: 'clusterId' });
      this.hasMany(models.DataflowClusterCredential, {
        foreignKey: 'cluster_id',
      });
      this.hasMany(models.FileTemplate, {
        foreignKey: 'cluster_id',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.FileMonitoring, {
        foreignKey: 'cluster_id',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.landingZoneMonitoring, {
        foreignKey: 'cluster_id',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.LandingZoneMonitoring, {
        foreignKey: 'clusterId',
        onDelete: 'NO ACTION',
      });
      this.hasMany(models.ClusterMonitoring, {
        foreignKey: 'clusterId',
        onDelete: 'CASCADE',
      });

      Cluster.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      Cluster.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      Cluster.belongsTo(models.User, {
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
      currencyCode: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'USD',
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
