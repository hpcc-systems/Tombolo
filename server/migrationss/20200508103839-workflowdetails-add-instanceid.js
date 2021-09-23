'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'workflowdetails',
      'instance_id', Sequelize.UUID, {
         after: 'id'
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'workflowdetails',
      'instance_id'
    );
  }
};