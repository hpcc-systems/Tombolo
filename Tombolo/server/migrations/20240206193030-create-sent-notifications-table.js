"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("sent_notifications", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      searchableNotificationId:{
        allowNull: false,
        type: Sequelize.STRING,
      },
      applicationId: {
        allowNull: true,
        type: Sequelize.UUID,
      },
      notifiedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      notificationOrigin: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      notificationChannel: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      notificationTitle: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      notificationDescription: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      recipients: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      resolutionDateTime: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      comment: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      createdBy: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedBy: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      metaData: {
        allowNull: true,
        type: Sequelize.JSON,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("sent_notifications");
  },
};
