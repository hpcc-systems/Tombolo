"use strict";
module.exports = (sequelize, DataTypes) => {
  const AsrDomains = sequelize.define(
    "asr_domains",
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
      severityThreshold: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      severityAlertRecipients: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
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
        defaultValue: { firstName: null, lastName: "System", email: "NA" },
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

  AsrDomains.associate = function (models) {
    AsrDomains.belongsToMany(models.monitoring_types, {
      through: "asr_monitoring_type_to_domains",
      foreignKey: "domain_id",
      as: "monitoringTypes",
    });

    AsrDomains.belongsToMany(models.asr_products, {
      through: "asr_domain_to_products",
      foreignKey: "domain_id",
      as: "associatedProducts",
    });
  };

  return AsrDomains;
};
