"use strict";
module.exports = (sequelize, DataTypes) => {
  const JobMonitoringDataArchive = sequelize.define(
    "jobMonitoring_Data_Archive",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "application",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      wuId: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      wuState: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      monitoringId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "jobMonitoring",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      wuTopLevelInfo: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      wuDetailInfo: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      analyzed: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      metaData: {
        allowNull: true,
        type: DataTypes.JSONB,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "jobMonitoring_Data_Archive",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["monitoringId", "wuId"],
          name: "jm_data_archive_unique_monitoringId_wuId", // Match the migration constraint name
        },
      ],
    }
  );

  // Associations
  JobMonitoringDataArchive.associate = (models) => {
    JobMonitoringDataArchive.belongsTo(models.application, {
      foreignKey: "applicationId",
      as: "application",
    });
    JobMonitoringDataArchive.belongsTo(models.jobMonitoring, {
      foreignKey: "monitoringId",
      as: "jobMonitoring",
    });
  };

  return JobMonitoringDataArchive;
};
