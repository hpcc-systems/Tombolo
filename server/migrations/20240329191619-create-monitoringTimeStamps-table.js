"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("monitoring_timestamps", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      applicationId: {
        allowNull: false,
        type: Sequelize.UUID,
      },
      cluster_id: {
        allowNull: false,
        type: Sequelize.UUID,
      },
      monitoring_type_id: {
        allowNull: false,
        type: Sequelize.UUID,
      },
      run_time: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("monitoring_timestamps");
  },
};
