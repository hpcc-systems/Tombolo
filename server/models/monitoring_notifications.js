'use strict';
module.exports = (sequelize, DataTypes) => {
    const monitoring_notifications = sequelize.define(
      "monitoring_notifications",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        monitoring_type: DataTypes.STRING,
        monitoring_id: DataTypes.UUID,
        application_id: DataTypes.UUID,
        file_name: DataTypes.STRING,
        notification_reason: DataTypes.STRING,
        notification_channel: DataTypes.STRING,
        status: DataTypes.STRING,
        responded_on: DataTypes.DATE,
        comment: DataTypes.TEXT,
        deletedAt: DataTypes.DATE
      },
      {
        paranoid: true,
        freezeTableName: true,
        sequelize,
        modelName: "monitoring_notifications",
      }
    );
    // Associations
    monitoring_notifications.associate = function (models) {
      monitoring_notifications.belongsTo(models.fileMonitoring, {
        foreignKey: "monitoring_id",
      });
      monitoring_notifications.belongsTo(models.clusterMonitoring, {
        foreignKey: "monitoring_id",
      });
      monitoring_notifications.belongsTo(models.JobMonitoring, {
        foreignKey: "monitoring_id",
      });
      monitoring_notifications.belongsTo(models.filemonitoring_superfiles, {
        foreignKey: "monitoring_id",
      });
      monitoring_notifications.belongsTo(models.application, {
        foreignKey: "application_id",
      });
    };
  return monitoring_notifications;
};