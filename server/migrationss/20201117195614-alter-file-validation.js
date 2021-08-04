'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('file_validation', 'name', 'rule_field'),
      queryInterface.renameColumn('file_validation', 'sequence', 'rule_name'),
      queryInterface.renameColumn('file_validation', 'rule', 'rule_test'),
      queryInterface.renameColumn('file_validation', 'fixScript', 'rule_fix'),
      queryInterface.removeColumn('file_validation', 'ruleType'),
      queryInterface.removeColumn('file_validation', 'action')
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('file_validation', 'rule_field', 'name'),
      queryInterface.renameColumn('file_validation', 'rule_name', 'sequence'),
      queryInterface.renameColumn('file_validation', 'rule_test', 'rule'),
      queryInterface.renameColumn('file_validation', 'rule_fix', 'fixScript'),
      queryInterface.addColumn('file_validation', 'ruleType', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'sequence'
      }),
      queryInterface.addColumn('file_validation', 'action', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'rule'
      })
    ]);
  }
};