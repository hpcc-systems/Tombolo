'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('superfile_monitorings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      clusterid: {
        type: Sequelize.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      application_id: {
        type: Sequelize.UUID,
        references: {
          model: 'applications',
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
      createdBy: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      updatedBy: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      deletedBy: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
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
      'superfile_monitorings',
      ['name', 'deletedAt'],
      {
        unique: true,
        name: 'fm_sf_unique_name_deleted_at',
      }
    );
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('superfile_monitorings');
  },
};
