'use strict';

// This Migration will remove   onDelete: 'cascade', onUpdate: 'cascade' on job_execution table, so we can keep track of job executions even if job was deleted

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeConstraint('job_execution', 'FK_JOB_ID_FOR_JOB_EXECUTION_TABLE' , { transaction: t }),
        queryInterface.addConstraint('job_execution', {
          fields: ['jobId'],
          type: 'FOREIGN KEY',
          name: 'FK_JOB_ID_FOR_JOB_EXECUTION_TABLE', 
          references: {
            table: 'job',
            field: 'id',
          },
        },{transaction: t})
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeConstraint('job_execution', 'FK_JOB_ID_FOR_JOB_EXECUTION_TABLE' , { transaction: t }),
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
        },{transaction: t})
      ]);
    });
  }
};
