'use strict';
module.exports = (sequelize, DataTypes) => {
    const filemonitoring_notifications = sequelize.define(
      "filemonitoring_notifications",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        filemonitoring_id: DataTypes.UUID,
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
        modelName: "filemonitoring_notifications",
      }
    );
    // Associations
    filemonitoring_notifications.associate = function (models) {
      filemonitoring_notifications.belongsTo(models.fileMonitoring, {
        foreignKey: "filemonitoring_id",
      });
      filemonitoring_notifications.belongsTo(models.application, {
        foreignKey: "application_id",
      });
    };
  return filemonitoring_notifications;
};