"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("notification_queue", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM("msTeams", "email"),
      },
      notificationOrigin: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      originationId: {
        allowNull: true,
        type: Sequelize.UUID,
      },
      deliveryType: {
        allowNull: false,
        type: Sequelize.ENUM("immediate", "scheduled"),
      },
      deliveryTime: {
        allowNull: true,
        type: Sequelize.DATE
      },
      lastScanned: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      attemptCount: {
        allowNull: false,
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0,
      },
      failureMessage: {
        allowNull: true,
        type: Sequelize.DataTypes.JSON,
      },
      reTryAfter: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      createdBy: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: "System",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedBy: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: "System",
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      metaData: {
        allowNull: true,
        type: Sequelize.JSON,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("notification_queue");
  },
};
