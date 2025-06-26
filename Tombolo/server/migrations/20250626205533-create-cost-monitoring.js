'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('costMonitoring', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      applicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'application',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      monitoringName: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
      isActive: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      approvalStatus: {
        allowNull: false,
        type: Sequelize.ENUM('Approved', 'Rejected', 'Pending'),
      },
      approvedBy: {
        allowNull: true,
        type: Sequelize.STRING,
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
        type: Sequelize.JSON,
        allowNull: false,
      },
      lastUpdatedBy: {
        allowNull: false,
        type: Sequelize.STRING,
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('costMonitoring');
  },
};
