'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'application',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'assets_groups',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'cluster',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'consumer_object',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'consumer',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'controls_regulations',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'data_types',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'dataflow',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'file_layout',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'file_license',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'file_validation',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'file',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'groups',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'index_key',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'index_payload',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'indexes',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'job_execution',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'job',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'jobfile',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'jobparam',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'message_based_jobs',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'query_field',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'query',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'rules',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'user_application',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'workflows',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.addColumn(
        'workflowdetails',
        'deletedAt', Sequelize.DATE
      )
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'application',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'assets_groups',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'cluster',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'consumer_object',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'consumer',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'controls_regulations',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'data_types',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'dataflow',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'file_layout',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'file_license',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'file_validation',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'file',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'groups',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'index_key',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'index_payload',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'indexes',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'job_execution',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'job',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'jobfile',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'jobparam',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'message_based_jobs',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'query_field',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'query',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'rules',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'user_application',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'workflows',
        'deletedAt', Sequelize.DATE
      ),
      queryInterface.removeColumn(
        'workflowdetails',
        'deletedAt', Sequelize.DATE
      )
    ])
  }
};