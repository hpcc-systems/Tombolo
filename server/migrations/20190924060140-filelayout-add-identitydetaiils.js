'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'file_layout',
      'identityDetail', Sequelize.STRING,{
        after: 'format'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'file_layout',
      'identityDetail'
    );
  }
};