"use strict";
module.exports = (sequelize, DataTypes) => {
  const AsrDomainToProductsRelation = sequelize.define(
    "asr_domain_to_products_relation",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      domain_id: {
        type: DataTypes.UUID,
      },
      product_id: {
        type: DataTypes.UUID,
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
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.JSON,
        defaultValue: { name: "system", email: "NA" },
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      deletedBy: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      freezeTableName: true,
    }
  );

  AsrDomainToProductsRelation.associate = function (models) {
    AsrDomainToProductsRelation.belongsTo(models.asr_domains, {
      foreignKey: "domain_id",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    AsrDomainToProductsRelation.belongsTo(models.asr_products, {
      foreignKey: "product_id",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return AsrDomainToProductsRelation;
};
