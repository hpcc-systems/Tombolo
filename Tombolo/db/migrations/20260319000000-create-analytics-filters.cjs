'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('analytics_filters', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(30),
      },
      conditions: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      description: {
        allowNull: true,
        type: Sequelize.STRING(255),
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
      'analytics_filters',
      ['name', 'createdBy', 'deletedAt'],
      {
        unique: true,
        name: 'analytics_filters_unique_name_user_deleted_at',
      }
    );

    await queryInterface.addIndex('analytics_filters', ['createdBy']);
  },

  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('analytics_filters');
  },
};
