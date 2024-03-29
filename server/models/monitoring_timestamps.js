"use strict";
module.exports = (sequelize, DataTypes) => {
  const monitoring_timestamps = sequelize.define("monitoring_timestamps", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.INTEGER,
      autoIncrement: true,
    },
    applicationId: {
      allowNull: false,
      type: DataTypes.UUID,
    },
    cluster_id: {
      allowNull: false,
      type: DataTypes.UUID,
    },
    monitoring_type_id: {
      allowNull: false,
      type: DataTypes.UUID,
    },
    run_time: {
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
    freezeTableName: true,
  });

  monitoring_timestamps.associate = function (models) {
    monitoring_timestamps.belongsTo(models.applications, {
      foreignKey: "applicationId",
      as: "applications",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    monitoring_timestamps.belongsTo(models.clusters, {
      foreignKey: "cluster_id",
      as: "clusters",
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    });
    monitoring_timestamps.belongsTo(models.monitoring_types, {
      foreignKey: "monitoring_type_id",
      as: "monitoring_types",
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    });
  };

  return monitoring_timestamps;
};
