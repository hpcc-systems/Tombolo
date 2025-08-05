'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('directory_monitorings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      cluster_id: {
        type: Sequelize.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      cron: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: false,
      },
      active: {
        allowNull: false,
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      description: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
      },
      machine: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      landingZone: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      directory: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
        defaultValue: 0,
      },
      metaData: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      approved: {
        allowNull: false,
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      approvalStatus: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      approvalNote: {
        allowNull: true,
        type: Sequelize.DataTypes.STRING,
      },
      approvedBy: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      approvedAt: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
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
      'directory_monitorings',
      ['name', 'deletedAt'],
      {
        unique: true,
        name: 'dm_unique_name_deleted_at',
      }
    );
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('directory_monitorings');
  },
};
