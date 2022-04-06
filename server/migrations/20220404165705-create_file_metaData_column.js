'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'file',
        'metaData',{
          after: 'name',
          type: Sequelize.JSON,
          defaultValue: null
        } 
      )
    ])
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'file',
        'metaData', Sequelize.JSON
      )
    ])
  }
};
