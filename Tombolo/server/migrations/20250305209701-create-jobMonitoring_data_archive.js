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
      applicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "application",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      wuId: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      wuState: {
        allowNull: false,
        type: Sequelize.STRING,
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
      wuTopLevelInfo: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      wuDetailInfo: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      analyzed: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      metaData: {
        allowNull: true,
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

    // Add a composite unique constraint on clusterId, monitoringId, and wuId
    await queryInterface.addConstraint("jobMonitoring_Data", {
      fields: [ "monitoringId", "wuId"],
      type: "unique",
      name: "jm_data_archive_unique_monitoringId_wuId", // Custom name for the constraint
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("jobMonitoring_Data_Archive");
  },
};
