'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MonitoringNotification extends Model {
    static associate(models) {
      MonitoringNotification.belongsTo(models.FileMonitoring, {
        foreignKey: 'monitoring_id',
      });

      MonitoringNotification.belongsTo(models.JobMonitoring, {
        foreignKey: 'monitoring_id',
      });

      MonitoringNotification.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });
    }
  }

  MonitoringNotification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      monitoring_type: DataTypes.STRING,
      monitoring_id: DataTypes.UUID,
      application_id: DataTypes.UUID,
      file_name: DataTypes.STRING,
      notification_reason: DataTypes.STRING,
      notification_channel: DataTypes.STRING,
      status: DataTypes.STRING,
      responded_on: DataTypes.DATE,
      metaData: DataTypes.JSON,
      comment: DataTypes.TEXT,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'MonitoringNotification',
      tableName: 'monitoring_notifications',
      paranoid: true,
    }
  );

  return MonitoringNotification;
};
