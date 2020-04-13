'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'job',
      'dataflowId', Sequelize.STRING, {
         after: 'application_id'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'job',
      'dataflowId'
    );
  }
};