'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('filemonitoring_superfiles', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      clusterid: {
        type: Sequelize.UUID,
        references: {
          model: 'cluster',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      cron: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
      monitoringActive: {
        type: Sequelize.BOOLEAN,
      },
      wuid: {
        type: Sequelize.STRING,
      },
      metaData: {
        type: Sequelize.JSON,
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
    await queryInterface.addIndex(
      'filemonitoring_superfiles',
      ['name', 'deletedAt'],
      {
        unique: true,
        name: 'fmsf_unique_name_deleted_at',
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('filemonitoring_superfiles');
  },
};
