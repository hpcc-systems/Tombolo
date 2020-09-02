'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'application',
        'creator', Sequelize.STRING
      )
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'application',
        'creator', Sequelize.STRING
      )
    ])
  }
};