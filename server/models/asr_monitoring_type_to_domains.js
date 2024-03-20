"use strict";
module.exports = (sequelize, DataTypes) => {
  const AsrMonitoringTypeToDomainsRelation = sequelize.define(
    "asr_monitoring_type_to_domains",
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
          model: "monitoring_types",
          key: "id",
        },
      },
      domain_id: {
        type: DataTypes.UUID,
        references: {
          model: "asr_domains",
          key: "id",
        },
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

  // AsrMonitoringTypeToDomainsRelation.associate = function (models) {
  //   AsrMonitoringTypeToDomainsRelation.belongsTo(models.monitoring_types, {
  //     foreignKey: "monitoring_type_id",
  //     onDelete: "CASCADE",
  //     onUpdate: "CASCADE",
  //   });
  //   AsrMonitoringTypeToDomainsRelation.belongsTo(models.asr_domains, {
  //     foreignKey: "domain_id",
  //     onDelete: "CASCADE",
  //     onUpdate: "CASCADE",
  //   });
  // };

  return AsrMonitoringTypeToDomainsRelation;
};
