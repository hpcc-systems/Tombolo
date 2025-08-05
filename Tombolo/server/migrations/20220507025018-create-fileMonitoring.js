'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('file_monitorings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cron: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      monitoringAssetType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      monitoringActive: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      wuid: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      metaData: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      fileTemplateId: {
        type: Sequelize.UUID,
        references: {
          model: 'file_templates',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cluster_id: {
        type: Sequelize.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
        allowNull: true,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('file_monitorings', ['name', 'deletedAt'], {
      unique: true,
      name: 'fm_unique_name_deleted_at',
    });
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('file_monitorings');
  },
};
