'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'filetemplate',
        'metaData',{
          after: 'sampleLayoutFile',
          type: Sequelize.JSON,
          defaultValue: null
        } 
      )
    ])
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'filetemplate',
        'metaData', Sequelize.JSON
      )
    ])
  }
};

