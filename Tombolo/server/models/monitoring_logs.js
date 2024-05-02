"use strict";
module.exports = (sequelize, DataTypes) => {
  const monitoring_logs = sequelize.define(
    "monitoring_logs",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      cluster_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      monitoring_type_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      scan_time: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
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
      metaData: {
        allowNull: true,
        type: DataTypes.JSON,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["cluster_id", "monitoring_type_id"],
        },
      ],
    }
  );

  monitoring_logs.associate = function (models) {
    monitoring_logs.belongsTo(models.cluster, {
      foreignKey: "cluster_id",
      as: "cluster",
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    });
    monitoring_logs.belongsTo(models.monitoring_types, {
      foreignKey: "monitoring_type_id",
      as: "monitoring_types",
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    });
  };

  return monitoring_logs;
};
