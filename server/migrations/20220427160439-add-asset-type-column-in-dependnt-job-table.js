'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'dependent_jobs',
        'dependOnAssetType',{
          after: 'dependsOnJobId',
          type: Sequelize.STRING,
        } 
      )
    ])
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'dependent_jobs',
        'dependOnAssetType', Sequelize.STRING
      )
    ])
  }
};