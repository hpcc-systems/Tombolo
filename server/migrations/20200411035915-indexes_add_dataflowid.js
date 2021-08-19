'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'indexes',
      'dataflowId', Sequelize.STRING, {
         after: 'application_id'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'indexes',
      'dataflowId'
    );
  }
};