'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('job_execution', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      status: Sequelize.STRING,
      wuid: Sequelize.STRING,
      wu_start: Sequelize.STRING,
      wu_end: Sequelize.STRING,
      wu_duration: Sequelize.STRING,
      manualJob_meta: Sequelize.JSON,
      jobExecutionGroupId: Sequelize.UUID,
      clusterId: {
        type: Sequelize.UUID,
        references: {
          model: 'clusters',
          key: 'id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
      },
      dataflowId: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 'dataflow',
          key: 'id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
      },
      jobId: {
        type: Sequelize.UUID,
        references: {
          model: 'job',
          key: 'id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
      },
      applicationId: {
        type: Sequelize.UUID,
        references: {
          model: 'applications',
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
    return queryInterface.dropTable('job_execution');
  },
};
