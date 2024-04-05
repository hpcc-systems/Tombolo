"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("directorymonitoring", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      application_id: {
        type: Sequelize.UUID,
        references: {
          model: "application",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cluster_id: {
        type: Sequelize.UUID,
        references: {
          model: "cluster",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      cron: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
      },
      active: {
        allowNull: false,
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      directory: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: 0,
      },
      metaData: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      approved: {
        allowNull: false,
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      approvalNote: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
      },
      approvedBy: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
      },
      approvedAt: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
      },
      createdBy: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
      updatedBy: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
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
    await queryInterface.dropTable("directorymonitoring");
  },
};
