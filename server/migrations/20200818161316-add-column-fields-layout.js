'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'file_layout',
        'fields', Sequelize.TEXT
      )
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'file_layout',
        'fields', Sequelize.TEXT
      )
    ])
  }
};