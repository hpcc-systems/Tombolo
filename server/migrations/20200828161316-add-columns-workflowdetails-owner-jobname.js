'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'workflowdetails',
        'owner', Sequelize.STRING
      ),
      queryInterface.addColumn(
        'workflowdetails',
        'jobName', Sequelize.STRING
      )

    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'workflowdetails',
        'owner', Sequelize.STRING
      ),
      queryInterface.removeColumn(
        'workflowdetails',
        'jobName', Sequelize.STRING
      )      
    ])
  }
};