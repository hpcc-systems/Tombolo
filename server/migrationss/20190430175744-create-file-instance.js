'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('file_instance', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      file_definition: {
        type: Sequelize.STRING
      },
      receive_date: {
        type: Sequelize.DATE
      },
      media_type: {
        type: Sequelize.STRING
      },
      update_type: {
        type: Sequelize.STRING
      },
      expected_file_count: {
        type: Sequelize.INTEGER
      },
      actual_file_count: {
        type: Sequelize.INTEGER
      },
      customer_name: {
        type: Sequelize.STRING
      },
      frequency: {
        type: Sequelize.STRING
      },
      next_expected_delivery: {
        type: Sequelize.STRING
      },
      item_name: {
        type: Sequelize.STRING
      },
      source_name: {
        type: Sequelize.STRING
      },
      data_provider_id: {
        type: Sequelize.STRING
      },
      member_id: {
        type: Sequelize.STRING
      },
      file_source_id: {
        type: Sequelize.STRING
      },
      data_profile_path: {
        type: Sequelize.STRING
      },
      cluster_id: {
        type: Sequelize.STRING
      },
      application_id: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('file_instance');
  }
};