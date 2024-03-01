"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("integrations", "config");
    await queryInterface.removeColumn("integrations", "metadata");
    await queryInterface.removeColumn("integrations", "active");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("integrations", "config", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("integrations", "metadata", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("integrations", "active", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
  },
};
