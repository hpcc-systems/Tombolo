'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('monitoring_notifications', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      monitoring_type: {
        type: Sequelize.STRING,
      },
      monitoring_id: {
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
      metaData: {
        type: Sequelize.JSON,
        allowNull: true,
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
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('monitoring_notifications');
  },
};
