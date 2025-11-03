'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cost_monitorings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      applicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      monitoringScope: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'clusters',
      },
      monitoringName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      isSummed: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN,
      },
      isActive: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      approvalStatus: {
        allowNull: false,
        type: Sequelize.ENUM('approved', 'rejected', 'pending'),
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
        type: Sequelize.DATE,
      },
      approverComment: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      description: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      clusterIds: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      lastJobRunDetails: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      metaData: {
        allowNull: false,
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
      lastUpdatedBy: {
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
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex(
      'cost_monitorings',
      ['monitoringName', 'deletedAt'],
      {
        unique: true,
        name: 'cost_mon_unique_monitoring_name_deleted_at',
      }
    );
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cost_monitorings');
  },
};
