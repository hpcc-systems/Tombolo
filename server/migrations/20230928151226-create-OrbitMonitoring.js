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
      Build: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
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
