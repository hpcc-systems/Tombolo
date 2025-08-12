'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cluster_monitoring', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      monitoringName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      clusterMonitoringType: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: ['status', 'usage'],
      },
      isActive: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      approvalStatus: {
        allowNull: false,
        type: Sequelize.ENUM('approved', 'rejected', 'pending'),
        defaultValue: 'pending',
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
      clusterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cluster',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      lastRunDetails: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      metaData: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: {
          contacts: {
            primaryContacts: [],
            secondaryContacts: [],
            notifyContacts: [],
          },
          monitoringData: {},
          asrSpecificMetaData: {},
        },
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
        allowNull: false,
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
    });

    await queryInterface.addIndex(
      'cluster_monitoring',
      ['monitoringName', 'deletedAt'],
      {
        unique: true,
        name: 'cluster_mon_unique_monitoring_name_deleted_at',
      }
    );
  },
  down: async queryInterface => {
    await queryInterface.dropTable('cluster_monitoring');
  },
};
