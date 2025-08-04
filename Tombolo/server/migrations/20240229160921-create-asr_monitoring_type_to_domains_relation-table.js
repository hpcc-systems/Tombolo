'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      'asr_monitoring_type_to_domains_relations',
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
        },
        monitoring_type_id: {
          type: DataTypes.UUID,
          references: {
            model: 'monitoring_types',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        domain_id: {
          type: DataTypes.UUID,
          references: {
            model: 'asr_domains',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        createdAt: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          allowNull: true,
          type: DataTypes.DATE,
        },
        deletedAt: {
          allowNull: true,
          type: DataTypes.DATE,
        },
        createdBy: {
          allowNull: false,
          type: DataTypes.JSON,
          defaultValue: { email: 'NA', lastName: 'NA', firstName: 'System' },
        },
        updatedBy: {
          allowNull: true,
          type: DataTypes.JSON,
        },
        deletedBy: {
          allowNull: true,
          type: DataTypes.JSON,
        },
      }
    );

    // Create constraints - monitoring_type_id, domain_id pair should be unique
    await queryInterface.addConstraint(
      'asr_monitoring_type_to_domains_relations',
      {
        type: 'unique',
        fields: ['monitoring_type_id', 'domain_id'],
        name: 'unique_monitoring_type_id_domain_id',
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('asr_monitoring_type_to_domains_relations');
  },
};
