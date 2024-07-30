"use strict";
module.exports = (sequelize, DataTypes) => {
  const SentNotifications = sequelize.define(
    "sent_notifications",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      searchableNotificationId: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      applicationId: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      notifiedAt: {
        allowNull: true, // Some notifications are just logged and not sent
        type: DataTypes.DATE,
      },
      notificationOrigin: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      notificationChannel: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      notificationTitle: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      notificationDescription: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      status: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      recipients: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      resolutionDateTime: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      comment: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.JSON,
        defaultValue: { name: "System", email: "N/A" },
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
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
      freezeTableName: true,
      paranoid: true,
    }
  );

  SentNotifications.associate = function (models) {
    // associations 
    SentNotifications.belongsTo(models.application, { foreignKey: 'applicationId'});
  };

  return SentNotifications;
};


/*
{
notifiedAt: 
notificationOrigin:
notificationChannel:
notificationTitle:
status:
intendedTo:
deliveredTo:
notificationContent:
resolutionDateTime: 
Comment:
createdBy:
CreatedAt:
updatedBy:
updatedAt:
deletedAt:
metaData: {
	notificationTemplate:
	asrRelatedMetaData : {
		Jira Tickets : 
		Domain:
		Product:
		Interception Stage:
		asrlogId:
		severity:
		primaryContact:
		secondaryContact:
		IssueDescription
	}
}
}
*/