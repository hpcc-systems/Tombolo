"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("jobMonitoring_Data_Archive", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      monitoringId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "jobMonitoring",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      metaData: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      archiveDate: {
        allowNull: false,
        type: Sequelize.DATE,
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("jobMonitoring_Data_Archive");
  },
};
