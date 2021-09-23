'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'datadictionary',
        'products', Sequelize.STRING
      )
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'datadictionary',
        'products', Sequelize.STRING
      )
    ])
  }
};