'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('file', 'isSuperFile', {
      type: Sequelize.BOOLEAN
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('file', 'isSuperFile', {
      type: Sequelize.STRING
    })
  }
};