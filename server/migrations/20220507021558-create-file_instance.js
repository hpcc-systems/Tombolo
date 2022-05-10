'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('file_instance', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      file_definition: Sequelize.STRING,
      receive_date: Sequelize.DATE,
      media_type: Sequelize.STRING,
      update_type: Sequelize.STRING,
      expected_file_count: Sequelize.INTEGER,
      actual_file_count: Sequelize.INTEGER,
      customer_name: Sequelize.STRING,
      frequency: Sequelize.STRING,
      next_expected_delivery: Sequelize.STRING,
      item_name: Sequelize.STRING,
      source_name: Sequelize.STRING,
      data_provider_id: Sequelize.STRING,
      member_id: Sequelize.STRING,
      file_source_id: Sequelize.STRING,
      data_profile_path: Sequelize.STRING,
      title: Sequelize.STRING,
      cluster_id: {
        type: Sequelize.UUID,
        references: {
          model: 'cluster',
          key: 'id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
      },
      application_id: {
        type: Sequelize.UUID,
        references: {
          model: 'application',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('file_instance');
  },
};
