'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('job_execution', 'jobExecutionGroupId', {
        type: Sequelize.UUID,
        after: "wuid"
      })
    ])
  },

  down: async (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('job_execution', 'jobExecutionGroupId')
    ])
  }
};
