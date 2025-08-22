'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SentNotification extends Model {
    static associate(models) {
      SentNotification.belongsTo(models.Application, {
        foreignKey: 'applicationId',
      });
    }
  }

  SentNotification.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      searchableNotificationId: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      idempotencyKey: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      applicationId: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      notifiedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      notificationOrigin: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      notificationChannel: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      notificationTitle: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      notificationDescription: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      status: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      recipients: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      resolutionDateTime: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      comment: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.JSON,
        defaultValue: { name: 'System', email: 'N/A' },
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      sequelize,
      modelName: 'SentNotification',
      tableName: 'sent_notifications',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['idempotencyKey', 'deletedAt'],
        },
      ],
    }
  );

  return SentNotification;
};
