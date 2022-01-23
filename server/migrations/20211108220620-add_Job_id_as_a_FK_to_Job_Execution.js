'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addConstraint('job_execution', {
        fields: ['jobId'],
        type: 'FOREIGN KEY',
        name: 'FK_JOB_ID_FOR_JOB_EXECUTION_TABLE', // useful if using queryInterface.removeConstraint
        references: {
          table: 'job',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([ queryInterface.removeConstraint('job_execution', 'FK_JOB_ID_FOR_JOB_EXECUTION_TABLE') ]) 
  }
};
