'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("monitoring_notifications", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      id: {
        type: Sequelize.UUID,
      },
      filemonitoring_id: {
        type: Sequelize.UUID,
      },
      application_id: {
        type: Sequelize.UUID,
      },
      file_name: {
        type: Sequelize.STRING,
      },
      notification_reason: {
        type: Sequelize.STRING,
      },
      notification_channel: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
      },
      responded_on: {
        type: Sequelize.DATE,
      },
      comment: {
        type: Sequelize.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('monitoring_notifications');
  }
};