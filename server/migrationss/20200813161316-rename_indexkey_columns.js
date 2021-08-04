'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('index_key', 'ColumnLabel', 'name'),
      queryInterface.renameColumn('index_key', 'ColumnType', 'type'),
      queryInterface.renameColumn('index_key', 'ColumnEclType', 'eclType'),

      queryInterface.renameColumn('index_payload', 'ColumnLabel', 'name'),
      queryInterface.renameColumn('index_payload', 'ColumnType', 'type'),
      queryInterface.renameColumn('index_payload', 'ColumnEclType', 'eclType')

    ]);      
  }
};