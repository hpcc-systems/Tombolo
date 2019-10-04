'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'file_layout',
        'description', Sequelize.TEXT
      ),
      queryInterface.addColumn(
        'file_layout',
        'required', Sequelize.BOOLEAN
      )
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'file_layout',
        'description', Sequelize.TEXT
      ),
      queryInterface.removeColumn(
        'file_layout',
        'required', Sequelize.BOOLEAN
      )
    ])
  }
};