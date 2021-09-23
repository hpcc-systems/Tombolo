'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'file',
      'dataflowId', Sequelize.STRING, {
         after: 'application_id'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'file',
      'dataflowId'
    );
  }
};