"use strict";
module.exports = (sequelize, DataTypes) => {
  const AsrProducts = sequelize.define(
    "asr_products",
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
        type: DataTypes.JSON,
        defaultValue: { firstName: null, lastName: "System", email: "NA" },
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      deletedBy: {
        allowNull: true,
        type: DataTypes.JSON,
        defaultValue: null,
      },
    },
    {
      freezeTableName: true,
    }
  );

  AsrProducts.associate = function (models) {
    AsrProducts.belongsToMany(models.asr_domains, {
      through: "asr_domain_to_products",
      foreignKey: "product_id",
      as: "associatedDomains",
    });
  };

  return AsrProducts;
};
