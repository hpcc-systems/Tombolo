'use strict';

const { Model, DataTypes } = require('sequelize');
const { DeleteMixin } = require('../utils/modelMixins/DeleteMixin');

module.exports = sequelize => {
  class AsrProduct extends DeleteMixin(Model) {
    static associate(models) {
      AsrProduct.belongsToMany(models.AsrDomain, {
        through: 'asr_domain_to_products_relations',
        foreignKey: 'product_id',
        as: 'associatedDomains',
      });

      AsrProduct.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      AsrProduct.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      AsrProduct.belongsTo(models.User, {
        foreignKey: 'deletedBy',
        as: 'deleter',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });
    }
  }

  AsrProduct.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      shortCode: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      tier: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: null,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      deletedBy: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: 'AsrProduct',
      tableName: 'asr_products',
    }
  );

  return AsrProduct;
};
