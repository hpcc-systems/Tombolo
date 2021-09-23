'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'file',
      'scope', Sequelize.STRING, {
         after: 'application_id'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'file',
      'scope'
    );
  }
};