'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'workflows',
      'dataflowId', Sequelize.UUID, {
         after: 'id'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'workflows',
      'dataflowId'
    );
  }
};