"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("orbitMonitoring", {
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
      name: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      cron: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      isActive: {
        allowNull: false,
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      build: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
      },
      severityCode: {
        allowNull: false,
        type: Sequelize.DataTypes.TINYINT,
        defaultValue: 0,
      },
      businessUnit: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
      },
      product: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
      },
      host: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
      },
      primaryContact: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
      },
      secondaryContact: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
      },
      metaData: {
        type: Sequelize.JSON,
        allowNull: true,
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
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("orbitMonitoring");
  },
};
