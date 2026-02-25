'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('orbit_build_data', {
      BuildInstanceIdKey: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      BuildTemplateIdKey: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      Name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      HpccWorkUnit: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      DateUpdated: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      Status_Code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      Version: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      observed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
      stable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stable_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_analyzed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      monitoring_id: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },
      notification_state: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status_history: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ),
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('orbit_build_data', [
      'monitoring_id',
      'observed_at',
    ]);
    await queryInterface.addIndex('orbit_build_data', [
      'monitoring_id',
      'HpccWorkUnit',
    ]);
    await queryInterface.addIndex('orbit_build_data', [
      'monitoring_id',
      'stable',
      'stable_at',
    ]);
    await queryInterface.addIndex('orbit_build_data', ['Name']);
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable('orbit_build_data');
  },
};
