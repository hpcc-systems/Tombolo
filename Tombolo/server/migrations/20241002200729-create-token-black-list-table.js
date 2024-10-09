"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("token_black_list", {
      id: {
        primaryKey: true,
        type: Sequelize.STRING,
        allowNull: false,
      },
      exp: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("token_black_list");
  },
};