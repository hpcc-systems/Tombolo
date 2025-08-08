'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificationQueue extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // associations can be defined here
    }
  }

  NotificationQueue.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM('msTeams', 'email'),
      },
      notificationOrigin: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      originationId: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      deliveryType: {
        allowNull: false,
        type: DataTypes.ENUM('immediate', 'scheduled'),
      },
      deliveryTime: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      templateName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      lastScanned: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      attemptCount: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      reTryAfter: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      failureMessage: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: 'System',
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedBy: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: 'System',
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      sequelize,
      modelName: 'NotificationQueue',
      tableName: 'notification_queue',
      freezeTableName: true,
    }
  );

  return NotificationQueue;
};
