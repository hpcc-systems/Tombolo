'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('application', 'description', { type: Sequelize.TEXT }),
      queryInterface.changeColumn('datadictionary', 'description', { type: Sequelize.TEXT }),
      queryInterface.changeColumn('dataflow', 'description', { type: Sequelize.TEXT }),
      queryInterface.changeColumn('file', 'description', { type: Sequelize.TEXT }),
      queryInterface.changeColumn('indexes', 'description', { type: Sequelize.TEXT }),
      queryInterface.changeColumn('job', 'description', { type: Sequelize.TEXT }),
      queryInterface.changeColumn('jobfile', 'description', { type: Sequelize.TEXT }),
      queryInterface.changeColumn('query', 'description', { type: Sequelize.TEXT }),
      queryInterface.changeColumn('workflows', 'description', { type: Sequelize.TEXT })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('application', 'description', { type: Sequelize.STRING }),
      queryInterface.changeColumn('datadictionary', 'description', { type: Sequelize.STRING }),
      queryInterface.changeColumn('dataflow', 'description', { type: Sequelize.STRING }),
      queryInterface.changeColumn('file', 'description', { type: Sequelize.STRING }),
      queryInterface.changeColumn('indexes', 'description', { type: Sequelize.STRING }),
      queryInterface.changeColumn('job', 'description', { type: Sequelize.STRING }),
      queryInterface.changeColumn('jobfile', 'description', { type: Sequelize.STRING }),
      queryInterface.changeColumn('query', 'description', { type: Sequelize.STRING }),
      queryInterface.changeColumn('workflows', 'description', { type: Sequelize.STRING })
    ]);
  }
};