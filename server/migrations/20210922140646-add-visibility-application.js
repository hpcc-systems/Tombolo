'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'application',
      'visibility', Sequelize.STRING, {
         after: 'description'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'application',
      'visibility'
    );
  }
};