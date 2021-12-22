'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'job',
        'metaData',{
          after: 'name',
          type: Sequelize.JSON,
          defaultValue:null
        } 
      )
    ])
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'job',
        'metaData', Sequelize.JSON
      )
    ])
  }
};
