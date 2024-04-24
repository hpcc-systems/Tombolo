"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("monitoring_logs", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      cluster_id: {
        allowNull: false,
        type: Sequelize.UUID,
      },
      monitoring_type_id: {
        allowNull: false,
        type: Sequelize.UUID,
      },
      scan_time: {
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
    await queryInterface.addIndex(
      "monitoring_logs",
      ["cluster_id", "monitoring_type_id"],
      {
        unique: true,
        name: "monitoring_logs_cluster_id_monitoring_type_id",
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("monitoring_logs");
  },
};