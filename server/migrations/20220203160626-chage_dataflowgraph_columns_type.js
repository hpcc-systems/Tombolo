'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.changeColumn('dataflowgraph', 'nodes', {
          type: Sequelize.DataTypes.JSON
        }, { transaction: t }),
        queryInterface.changeColumn('dataflowgraph', 'edges', {
          type: Sequelize.DataTypes.JSON
        }, { transaction: t }),
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.changeColumn('dataflowgraph', 'nodes', {
          type: Sequelize.DataTypes.TEXT
        }, { transaction: t }),
        queryInterface.changeColumn('dataflowgraph', 'edges', {
          type: Sequelize.DataTypes.TEXT
        }, { transaction: t }),
      ]);
    });
  }
};
