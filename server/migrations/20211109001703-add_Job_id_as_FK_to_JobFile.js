'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      // public async changeColumn(tableName: string, attributeName: string, dataTypeOrOptions: object, options: object): *
      queryInterface.changeColumn('jobfile','job_id', {type:Sequelize.UUID, allowNull:false})
      .then(()=>{
          queryInterface.addConstraint('jobfile', {
            fields: ['job_id'],
            type: 'FOREIGN KEY',
            name: 'FK_JOB_ID_IN_JOBFILE', // useful if using queryInterface.removeConstraint
            references: {
              table: 'job',
              field: 'id',
            },
            onDelete: 'cascade',
            onUpdate: 'cascade',
          })
        })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([ queryInterface.removeConstraint('jobfile', 'FK_JOB_ID_IN_JOBFILE').then(()=> queryInterface.changeColumn('jobfile','job_id', {type:Sequelize.STRING})) ]) 
  }
};
