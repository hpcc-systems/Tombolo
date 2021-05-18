'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'job',
      'scriptPath', Sequelize.STRING, {
         after: 'wuid'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'job',
      'scriptPath'
    );
  }
};