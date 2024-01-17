"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("jobMonitoring", {
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
      monitoringName: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
      isActive: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      // isApproved: {
      //   allowNull: true,
      //   type: Sequelize.BOOLEAN,
      // },

      approvalStatus: {
        allowNull: false,
        type: Sequelize.ENUM("Approved", "Rejected", "Pending"),
      },
      approvedBy: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      approvedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      approverComment: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      description: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      monitoringScope: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      clusterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "cluster",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "NO ACTION",
      },
      jobName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      metaData: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      createdBy: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      lastUpdatedBy: {
        allowNull: false,
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("jobMonitoring");
  },
};
