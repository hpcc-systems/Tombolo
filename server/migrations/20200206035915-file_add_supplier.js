'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'file',
      'supplier', Sequelize.STRING, {
         after: 'serviceUrl'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'file',
      'supplier'
    );
  }
};