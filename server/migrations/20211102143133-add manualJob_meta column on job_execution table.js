'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('job_execution', 'manualJob_meta', {
        type: Sequelize.JSON,
      })
    ])
  },

  down: async (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('job_execution', 'manualJob_meta')
    ])
  }
};
