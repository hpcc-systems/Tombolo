'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'indexes',
      'name', Sequelize.STRING, {
         after: 'title'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'indexes',
      'name'
    );
  }
};