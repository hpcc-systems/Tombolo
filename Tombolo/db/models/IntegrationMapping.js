'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IntegrationMapping extends Model {
    static associate(models) {
      IntegrationMapping.belongsTo(models.Integration, {
        as: 'integration',
        foreignKey: 'integration_id',
      });
      IntegrationMapping.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });
    }
  }

  IntegrationMapping.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      integration_id: {
        type: DataTypes.UUID,
        references: {
          model: 'integrations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      application_id: {
        type: DataTypes.UUID,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'IntegrationMapping',
      tableName: 'integration_mappings',
      paranoid: true,
    }
  );

  return IntegrationMapping;
};
